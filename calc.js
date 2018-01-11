// ToDo:
// DONE!!! 1. add animation for previous answer
// DONE!!! 2. change appearance of 'sqr', 'pwr' and '.' butttons
// 3. Add memory and 'ANS' functionality
// 4. add calc functioanlity for 2+ (like 2++)
// 5. Add a copy to clipboard feature if an answer is showing
// DONE!!! 6. Improve backspace functioanlity: 
// DONE!!!    (should delete the answer in one click and go back to previous expession)
// 7. Make display text size adjust to the number of digits on the screen
//    and handle overflowing text.
// 8. handle answers in exponenet form (so they fit on the screen)
// 9. allow negation in front of parens


// Problems
// 1. 2^(2+3)^2 (problem with display)
// 2. √(√(2)) (unable to calc)
// DONE!!! 3. (2+3)3 should display as (2+3)×3
// DONE!!! 4. 2√() should diplay as 2×√() and √(2)3 should be √(2)×3 (same as 3)  


// Possible
// 1. make squares and powers slightly smaller
// 2. refactor rendering of previous answer
// DONE!!! 3. insert commas for large numbers

const calc = {
  
  entry: '',
  
  lastCalculation: '',
  
  isResult: false,
  
  init() {
    this.cacheDom();
    this.listen();
    this.renderDisplay('0');
  },
      
  cacheDom() {
    this.calc = document.getElementById('calc');
    this.display = document.getElementById('display');
    this.previousAnswer = document.getElementById('previous');
  },
  
  listen() {
    this.calc.addEventListener('click', (e) => {
      const target = e.target;
      
      // handle calc button presses
      if (target.classList.contains('calc__btn')) {
        this.keypress(target);
      }
    });
  },
  
  keypress(target) {
      
    const pressed = target.innerHTML;

    let value = ''; // value to add to the entry string
    switch (pressed) {
      
      case '=':
        
        if (this.entry) {
          this.isResult = true;
          
          // store the expression entered
          const expression = this.autoCloseParens(this.entry);
          this.lastCalculation = expression;

          // render the expression that gave this result
          this.previousAnswer.classList.remove('transition');
          this.previousAnswer.offsetLeft; // cause repaint
          this.previousAnswer.classList.add('transition');  
          this.render(this.previousAnswer, this.stringToHtml(expression) + '=');
                    
          // calculate and render the answer
          try {
		    
            let answer = parseFloat(
              this.calculate(expression).toPrecision(13)
            ); 
            
            if ( answer === Infinity || 
                 answer === -Infinity || 
                 answer !== answer ) // test for NaN
              answer = "ERROR";
            
            this.entry = answer.toString();			
		  
          } catch(err) {
              this.entry = "ERROR";
              console.log('ERROR:', err.message);
          }
        }    
        break;
        
      case '+/−':  
        
        const num = this.lastFullNum;

        if (num !== null) {
         
          let negatedNum = -Number(num);
              
          
          // number ends in '.' or '.' followed by only zeros
          let match;
          if (match = num.match(/\.0*$/)) {
            let prefix = 1 / negatedNum < 0 ? '-' : '';
            negatedNum = prefix + negatedNum + match[0];
          } 
      
          this.entry = this.entry.replace(new RegExp(num + '$'), negatedNum);
        }    
        break;
      
        
      case 'AC':
        this.clearDisplay();
        break;
        

      case '⌫': // backspace
        
        // if result is displayed, clear the entire result and go back to 
        // previous expression entered
        if (this.isResult) {
          this.clearDisplay();
          this.entry = this.lastCalculation;
          break;
        }
        
        // remove two characters if string ends in '√(' or, for example, '-3'
        else if ( /√\($/.test(this.entry) || /\-\d$/.test(this.entry) )
          this.entry = this.entry.slice(0, -2);
        
        // default: remove the last character
        else
          this.entry = this.entry.slice(0, -1);
        
        if (!this.entry.length) {
        }
        break;
      
        
      case 'x²':
        value = '^2';
        break;
        
        
      case 'xʸ':
        if (!this.isPower) {
          value = '^';
        }
        break;
        
        
      case '√':
        value = '√('
        break;
        
        
      case '+':
      case '−':
      case '×':
      case '÷':
        
        const lastDigit = this.entry.slice(-1);
        
        if (!lastDigit) {
          value = '0' + pressed;
        
        // if last digit is already an operator, swap it
        } else if ('+−×÷'.indexOf(lastDigit) !== -1) {        
            this.entry = this.entry.slice(0, -1) + pressed; 
        
        } else {
          value = pressed;
        }
        
        break;
          
      
      case '.':
        if (!this.hasDecimal) {
          value = /\d+$/.test(this.entry) ? '.' : '0.'
        }
        break;
       
        
      case '(':
        value = this.lastFullNum ? '×(' : '(';  
        break;
        
        
      case ')':
        if (this.hasUnclosedParens)
          value = ')';
        break;
    
                
      case '0':
        if (this.lastFullNum !== '0' && this.entry !== '') {
          value = '0';
        }
        break;
      
    
      default: // numbers
        
        if (this.isResult)
          this.clearDisplay();
            
        if (this.entry === '0')
          this.entry = '';
        
        // insert × if the digit comes immediately after a clsing parens 
        value = this.lastDigit === ')' ? '×' + pressed : pressed;
        
    }
    
    // no longer a result
    if (pressed !== '=')
      this.isResult = false;
    
    // add the value to the entry string
    if (value !== '') {
      this.entry += value;
    }
    
    this.renderDisplay(this.stringToHtml(this.entry) || '0');
  },
    
  // render functions:
  render(el, html) {
    el.innerHTML = html;
  },
    
  renderDisplay(val) {
    this.render(this.display, val);
  },
  
  clearDisplay() {
    this.entry = '';
    this.previousAnswer.innerHTML = '';
  },
  
  // validation getters:
  get hasDecimal() {
    return /\d+\.\d*$/.test(this.entry);
  },
  
  get lastDigit() {
    return this.entry[this.entry.length - 1];
  },
  
  get lastFullNum() {
    const lastNum = this.entry.match(/\-?\d+(\.\d*)?$/);
    return lastNum ? lastNum[0] : null;
  },
  
  get isPower() {
    return this.entry.match(/\^$/); 
  },
  
  get hasUnclosedParens() {
    
    let leftParens = 0,
        rightParens = 0;
    
    for (let i = 0, len = this.entry.length; i < len; i++) {
      if ( this.entry[i] === '(' )
        leftParens++;
      else if ( this.entry[i] === ')' )
        rightParens++;
    }
    
    return leftParens > rightParens;
  }
  
}

calc.init();










// helpers...

calc.autoCloseParens = function(str, type) {

    let openParens = 0,
        closedParens = 0;

    for (let i = 0, len = str.length; i < len; i++) {
      if (str[i] === '(') openParens++
      if (str[i] === ')') closedParens++;
    }
      let open = openParens - closedParens,
          output = str;

      const closingParens = type === 'auto' ? 
            '<span class="open-parens">)</span>' : ')';

      while(open > 0) {
        output += closingParens;
        open--;
      }
    return output;
  }

calc.stringToHtml = function(str) {
 
  let outputStr = parensInPowers(this.autoCloseParens(str, 'auto'));
  
  const powers = /\^([^+−×÷()<]+)/g;
  let match;
    while(match = powers.exec(outputStr)) {
      outputStr = outputStr.replace(powers, '<sup>$1</sup>');
    }
  return this.addCommas(outputStr);


  function parensInPowers(str) {
    let match,
        outputString = str;
    const powers = /\^\(/g;

    while (match = powers.exec(str)) {

      const leftParensIndex = match.index + 1,
            rightParensIndex = closingParensIndex(str, leftParensIndex),
            partToReplace = str.slice(leftParensIndex, rightParensIndex + 1);
            
      outputString = str.replace('^' + partToReplace, '<sup>' + partToReplace + '</sup>');
    }
    return outputString;
  }

  function closingParensIndex(str, openParensIndex) {
    let leftParens = 1,
        rightParens = 0;
    for (let i = openParensIndex + 1, len = str.length; i < len; i++) {
      if (str[i] === '(') {
        leftParens++;
      } else if (str[i] === ')') {
        rightParens++;
      }
      if (leftParens === rightParens) {
        return i;
      }
    } 
    return null;
  }
}

calc.addCommas = function(expression) {
  return expression.replace(/\d+(\.\d*)?/g, function(num) {
    const parts = num.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
  });
}


calc.calculate = (function() {
  
// Shunting-yard algorithm
// see https://en.m.wikipedia.org/wiki/Shunting-yard_algorithm  
function shunt(mathString) {
  

// Helper functions  
function precedence(operator) {
  if (operator === '^') 
    return 4
  if (operator === '×' || operator === '÷')
    return 3;
  if (operator === '+' || operator === '−')
    return 2;
}
  
  function precedenceDiff(a, b) {
    return precedence(a) - precedence(b);
  }
  
function leftAssosciativity(operator) {
  return operator !== '^'
} 
 
  // parse the string
  let i = 0;
  const expression = mathString
  
    .replace(/\s/g, '')  //remove whitespace
  
    .replace(/√(\(.*\))/g, '$1^0.5'), // e.g. √4 -> 4^0.5 

        len = expression.length,
        output = [],
        opStack = [];
  
  
  while(i < expression.length) {
    let remainingExpression = expression.substring(i, len);
    
    // deal with numbers
    const num = remainingExpression.match(/^\-?\d+(\.\d*)?/);
    if (num) {
      output.push(Number(num[0])); // num[0] is the match
      i += num[0].length;
    
    // deal with operators
    } else {
      const op = remainingExpression[0];
    
      // deal with parentheses
      if (op === '(') {
        opStack.unshift(op);
          
      } else if (op === ')') {
        while (opStack[0] !== '(') {
          output.push(opStack.shift());
        }
        
        // discard the '(' operator from the opStack
        opStack.shift();
      
      // deal with all other operators
      } else {
           
        while (opStack.length && 
                (precedenceDiff(opStack[0], op) > 0 || 
                  ( precedenceDiff(opStack[0], op) === 0 
                  && leftAssosciativity(opStack[0]) )
                )
              ) {
        
          output.push(opStack.shift());
        }
        
        opStack.unshift(op);
          
      }
      
      i++;
    } 
  } 
  return output.concat(opStack);
  
} 
  

// https://en.m.wikipedia.org/wiki/Reverse_Polish_notation

function reversrPolishEvaluate(arr) {
  
  function operation(operator) {
    
    if (operator === '+') {
      return function(a, b) {
        return a + b;
      }
    }
    
    if (operator === '−') {
      return function(a, b) {
        return a - b;
      }
    }
      
    if (operator === '×') {
      return function(a, b) {
        return a * b;
      }
    }
      
    if (operator === '÷') {
      return function(a, b) {
        return a / b;
      }
    }
    
    if (operator === '^') {
      return function(a, b) {
        return Math.pow(a, b);
      }
    }
  }
  
  
  const stack = [];
  
  for (let i of arr) {
   if (typeof i === 'number') {
     stack.push(i);
   } else {
     const op2 = stack.pop();
     const op1 = stack.pop();
     const result = operation(i)(op1, op2);
     stack.push(result);
   }
    
  }
  return stack.pop();
}  
 
  
return function(str) {
  return reversrPolishEvaluate(shunt(str));
}  
  
})();




  
  





