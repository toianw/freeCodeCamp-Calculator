// ToDo:

// 1. add calc functioanlity for 2+ (like 2++)
// 2. Add a copy to clipboard feature if an answer is showing
// 3. allow negation in front of parens ???
// 4. IMPORTANT: allow the previous answer text to resize if it doesn't fit in the box

// Problems (think about this)
// 1. keep precision in memory, but round for display 



const calc = {
  
  entry: '',
  
  lastCalculation: '',
  
  // flags
  isResult: false,
  isSquare: false,
  
  // memory and Ans storage
  memory: '',
  storedAnswer: '',
  
  init() {
    this.cacheDom();
    this.listen();
    this.renderDisplay('0');
  },
      
  cacheDom() {
    this.calc = document.getElementById('calc');
    this.display = document.getElementById('display');
    this.previousAnswer = document.getElementById('previous');
    this.calcButtons = Array.from(document.querySelectorAll('.calc__btn'));
    this.screen = document.querySelector('.calc__display');
    
    // Individual Memory buttoms
    this.memoryButtons = Array.from(document.querySelectorAll('.calc__mem-btn'));
    this.memoryButtons.forEach(btn => {
      this[btn.innerHTML] = btn;
    });
    
    // Memory Value
    this.memoryDisplay = document.querySelector('.calc__memory-display');
    this.memoryVal = document.getElementById('calc__mem-val')
 
  },
  
  listen() {
    
    this.calcButtons.forEach(btn => {
      
      btn.addEventListener( 'click', this.keypress.bind(this, btn) );
      
      // for css effects, deal with mouse and touch events seperately
      btn.addEventListener( 'mouseenter', this.onHover.bind(this, btn) );
      
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.onHover(btn);
        
        // handle the 'click'
        this.keypress(btn);
      });
      
      btn.addEventListener('mouseleave', this.offHover.bind(this, btn));
      
      btn.addEventListener('touchend', (e) => {
        setTimeout(this.offHover.bind(this, btn), 100);
      });
    });
  
  },
  
  // CALC BUTTONS:
  
  keypress(btn) {
   
    const pressed = btn.innerHTML;

    // Clear the display for a fresh calculation:
    if ( this.isResult && /[0-9√(.⌫]/.test(pressed) )
        this.clearDisplay();
    
    // Only allow actions that clear the display if 'ERROR' is showing
    if (this.isError) { 
      if ( /[0-9.()√⌫]|Ans|MR|AC/.test(pressed) ) {
        this.clearDisplay();
      } else { 
        return;
      }
    }
      
    let value = ''; // value to add to the entry string
    
    switch (pressed) {
      
      case '=':
        
        if (this.entry) {
          
          this.isResult = true;
          
          // store the expression entered
          const expression = this.autoCloseParens(this.entry);
          this.lastCalculation = expression
            .replace(/Ans/g, this.storedAnswer )
            .replace(/\-\-/g, ''); // remove double negaives

          // render the expression that gave this result
          this.renderPreviousAnswer();

                    
          // calculate the answer
          try {
		    
            let answer = parseFloat(
              this.calculate(expression).toPrecision(14)
            ); 
            
            if ( answer === Infinity || 
                 answer === -Infinity || 
                 answer !== answer ) // test for NaN
              answer = "ERROR";
            
            this.entry = answer.toString();
            if (this.entry !== 'ERROR')
              this.storedAnswer = this.entry;
		  
          } catch(err) {
              this.entry = "ERROR";
              console.log('ERROR:', err.message);
          }
        }    
        break;
        
        
      case 'AC':
        this.clearDisplay();
        break; 
        
        
      case '+/−':
        const num = this.lastFullNum;
        
        if (num === null || num === '0')
          break;
        
        const negatedNum = num[0] === '-' ? num.slice(1) : '-' + num;
        this.entry = this.entry.replace(new RegExp(num + '$'), negatedNum);
        break;
        

      case '⌫': // backspace

        // determine index to delete from
        const match = this.entry.match(/√\($/) ||  //root followed by open parens
          this.entry.match(/e[+-]\d$/) || // e+ or e- (in scientific notation)
          this.entry.match(/\-\d$/) ||  // negative one digit number
          this.entry.match(/\^(\d|\()$/) || // one digit power or open parens in power
          this.entry.match(/\-?[a-zA-Z]+$/); // text (ERROR, Ans or -Ans)
         
        // delete it
        this.entry = this.entry.slice(0, match ? match.index : -1);
          
        // go back to the previous expression entered if all 
        // of the current entry string is deleted
        if (this.entry.length === 0) {
            this.clearDisplay();
            this.entry = this.lastCalculation;
            this.lastCalculation = '';
          }
        
        break;
      
        
      case 'x²':
        if (this.powerAllowed) {  
          value = '^2';
          this.isSquare = true;
        }
        break;
        
        
      case 'xʸ':
        if (this.powerAllowed) 
          value = '^';
        break;
        
        
      case '√':
        value = '√('
        break;
        
        
      case '+':
      case '−':
      case '×':
      case '÷':
        
        if (!this.lastDigit) {
          value = '0' + pressed;
        
        // if last digit is already an operator, swap it
        } else if (this.isOperator) {
            this.entry = this.entry.slice(0, -1) + pressed; 
        
        } else {
          value = pressed;
        }
        
        break;
          
        
      case '(':
        value = this.isSquare ? '×(' : '(';  
        break;
        
  
      case ')':
        if (this.hasUnclosedParens)
          value = ')';
        break;
    
                
      case '.':
        if (!this.hasDecimal) 
          value = /\d+$/.test(this.entry) ? '.' : '0.'
        break;
        
      
      case '0':
        if (this.lastFullNum !== '0' && this.entry !== '') 
          value = '0';
        break;
        
      // MEMORY BUTTONS
      
      // add the value to memory
      // If it already has a value, add the current display to the value
      case 'M+':
        if (this.isClickable('M+')) {
          
          this.memory = this.memory === '' ? 
          Number(this.entry) : this.memory + Number(this.entry);
          
          this.memoryVal.innerHTML = this.memory;
          this.isResult = true;
        }
        
        break;
      
        
      case 'M-':
        if (this.isClickable('M-')) {
        
          this.memory = this.memory === '' ? 
            -Number(this.entry) : this.memory - Number(this.entry);
          
          this.memoryVal.innerHTML = this.memory;
          this.isResult = true;
          }
        
        break;
      
        
      case 'MC':
        this.memory = '';
        break;
        
      // display the current value in the memory
      case 'MR':
        if (!this.isClickable('MR'))
          break;
        
        if (this.isResult)
          this.clearDisplay();
        
        value = (this.lastFullNum || this.lastDigit === ')' ? '×' : '') + this.memory;
        break;
        
      // the previously calculated answer  
      case 'Ans':
        
        if (!this.isClickable('Ans'))
          break;
          
        if (this.isResult)
          this.clearDisplay();
        
        value = this.lastFullNum || this.lastDigit === ')' ? '×Ans' : 'Ans'; 

        this.render(this.previousAnswer, 'Ans=' + this.storedAnswer);
        
        break;
      
    
      default: // all numbers (except 0) 

        if (this.entry === '0')
          this.entry = '';
        
        // insert × if the digit comes immediately after a closing parens or square 
        if (this.lastDigit === ')' || this.isSquare) {
          value = '×' + pressed;
        } else {
          value = pressed;
        }
        
    }
    // END OF SWITCH, PROCESS THE ENTRY:
    
    // no longer a result
    if (pressed !== '=' && pressed !== 'M+' && pressed !== 'M-')
      this.isResult = false;
    
    // no longer a square
    if (pressed !== 'x²')
      this.isSquare = false;
    
    // add the value to the entry string
    if (value !== '') {
      this.entry += value;
    }
    
    // update the display
    this.renderDisplay(this.stringToHtml(this.entry) || '0');
        
    // style the currently clickable memory buttons
    this.styleMemoryButtons();
  },
  

    
  // render functions:
  render(el, html) {
    el.innerHTML = html;
  },
    
  renderDisplay(val) {
    
    //default font size
    this.display.style.fontSize = '40px';
    
    // render
    this.render(this.display, val);

    // reduce the font size if the display does't fit the screen
    // down to a minimum of 22px
    let displayWidth = this.display.getBoundingClientRect().width,
        screenWidth = this.screen.getBoundingClientRect().width,
        remainingPixels = screenWidth - displayWidth,
        
        fontSize = parseInt(this.display.style.fontSize);
    
    while (remainingPixels < 0 && fontSize > 22) {
       
      this.display.style.fontSize = fontSize-- + 'px' ;
      
      displayWidth = this.display.getBoundingClientRect().width;
      screenWidth = this.screen.getBoundingClientRect().width;
      remainingPixels = screenWidth - displayWidth;
    }
    
  },
  
  renderPreviousAnswer() {
    this.previousAnswer.classList.remove('transition');
    this.previousAnswer.offsetLeft; // cause repaint
    this.previousAnswer.classList.add('transition');  
    this.render(this.previousAnswer, 
      this.stringToHtml(this.lastCalculation) + '=');
  },
  
  clearDisplay() {
    this.entry = '';
    this.previousAnswer.innerHTML = '';
  },
  
  styleMemoryButtons() {

    // Ans btn clickable once a calculation has been made 
    if (this.storedAnswer !== '' && this.storedAnswer !== 'ERROR') 
      this.addClass('clickable', this.Ans);
    else
      this.removeClass('clickabl', this.Ans) 
    
    
    // M+ and M- buttons clickable only if entry is a number
    if (this.entryIsNumber) 
      this.addClass('clickable', this['M+'], this['M-']);
    else 
      this.removeClass('clickable', this['M+'], this['M-']);
    
    
    // MR and MC buttons clickable when something is stored in the memory
    // Disiplay memory value only if it has a value 
    if (this.memory !== '') {
      this.addClass('clickable', this.MR, this.MC);
      this.addClass('visible', this.memoryDisplay);

    } else { 
      this.removeClass('clickable', this.MR, this.MC);
      this.removeClass('visible', this.memoryDisplay);
    }
    
  },
  
  // validation getters & helpers:
  get hasDecimal() {
    return /\d+\.\d*$/.test(this.entry);
  },
  
  get lastDigit() {
    return this.entry.slice(-1);
  },
  
  get lastFullNum() {
    const lastNum = this.entry.match(/\-?(\d(?:\.\d+)?)e([+-]\d+)$/) || // scientific notation
          this.entry.match(/(\-?\d+(\.\d*)?$)|-?Ans$/); // other numbers or +/-Ans 
    return lastNum ? lastNum[0] : null;
  },
  
  get isPower() {
    return this.entry.match(/\^$/); 
  },
  
  get isOperator() {
    return '+−×÷'.indexOf(this.lastDigit) !== -1;
  },
  
  get isError() {
    return this.entry.toUpperCase() === 'ERROR';
  },
  
  get entryIsNumber() {
    return /^\-?(\d+(\.\d*)?$)|-?Ans$/.test(this.entry);
  },
  
  get powerAllowed() {
    return !this.isOperator && !this.isPower && this.lastDigit !== '(' 
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
  },
  
  isClickable(btn) {
    return this[btn].classList.contains('clickable');
  },
  
  addClass(className, ...els) {
    els.forEach(el => el.classList.add(className));
  },
  
  removeClass(className, ...els) {
    els.forEach(el => el.classList.remove(className));
  },  

  // styling
  onHover(btn) {
    if (btn.classList.contains('calc__mem-btn') && !btn.classList.contains('clickable'))
      return;
    btn.classList.add('hover');
  },
  
  offHover(btn) {
    btn.classList.remove('hover');
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

      const closingParens = type || ')';

      while(open > 0) {
        output += closingParens;
        open--;
      }
    return output;
  }

calc.closingParensIndex = function(str, openParensIndex) {

  let leftParens = 1,
      rightParens = 0;
  
  for (let i = openParensIndex + 1, len = str.length; i < len; i++) {
    if (str[i] === '(') {
      leftParens++;
    } else if (str[i] === ')' || str[i] === '}') {
      rightParens++;
    }
    if (leftParens === rightParens) {
      return i;
    }
  } 
  return null;
};


// pipes str though all funcs and returns the result
calc.pipe = function(str, ...funcs) {
  return funcs.reduce( (str, func) => func(str), str );
};


// prettify the str for output to the display  
calc.stringToHtml = function(str) {

  return this.pipe(str,
                   
      // '}' is a placeholder for unclosed ')'
      this.autoCloseParens.bind(this, str, '}' ), 
      this.prettifyPowers,
      this.addCommas,
      this.prettifyExps
    )
    
    // replace '}' with markup for a unclosed right parens
    .replace(/\}/g, '<span class="open-parens">)</span>');

};


// puts powers inside html <sup> tags
calc.prettifyPowers = function(str) {

  function insertHtmlSups(str) {
     
    const position = str.indexOf('^');
    
    // allow the final '^' to show until another character is added 
    if (position === -1 || /^\^[»)}]*$/.test(str.slice(position)) ) {
      return str;
    }
    
    // '«' & '»' are palceholders for <sup> & </sup> tags respectively.
    // '}' is a placeholder for an unclosed right parens 
    //     i.e. for <span class="unclosed-parens">)</span>
    str = str.replace('^', '«');
    
    let i = position;
    
    // parse the string
    while (i < str.length) {
      
      // if opening parens, skip over everything inside the parens 
      if ( str[i] === '(' )
        i = calc.closingParensIndex(str, i) + 1;
      
      // if reach an operator or a closing parens or closing 'tag' (»)
      // insert the closing » tag right before it.
      if ( ['+', '−', '×', '÷', ')', '}', '»'].indexOf(str[i]) !== -1 ) {
        str = str.substring(0, i) + '»' + str.substring(i);
        return insertHtmlSups(str);
      }
      i++;
    }
    
    // reached the end of the string, so closing » must go here
    str = str + '»';
    return insertHtmlSups(str);
 }
  
  return insertHtmlSups(str)
    .replace(/«/g, '<sup>')
    .replace(/»/g, '</sup>');
    
};


// outputs markup to alllow styling of scientific output (e.g. 2.75E-17)
calc.prettifyExps = function(val) {
    return val.replace(/(\d(?:\.\d+)?)e([+-]\d+)/, 
      '$1<span class="exp">e</span><sup>$2</sup>');
};
 

// adds commas to seperate thousands 
calc.addCommas = function(expression) {
  return expression.replace(/\d+(\.\d*)?/g, function(num) {
    const parts = num.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
  });
};


// CALCULATING ENGINE.......... 

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
  
  function convertRoots(str) {

    while (str.indexOf('√(') !== -1) {

      const match = str.indexOf('√'),
            leftParens = match + 1,
            rightParens = calc.closingParensIndex(str, leftParens),
            parens = str.substring(leftParens, rightParens + 1);

      str = str.replace('√' + parens, parens + '^0.5');

    }
      return str;
  }
 
  // first clean up the entry string  
  let expression = mathString
  
    // get rid of any whitespace
    .replace(/\s/g, '')
    
    // replace 'Ans' with value
    .replace(/Ans/g, calc.storedAnswer)
    
    // deal with double negatives
    .replace(/\-\-/g, '')
    
    //insert a '×' where required
    .replace(/(\)|\d|\.)(\(|√)/g, '$1×$2');
  
  //convert '√a' to a^0.5
  expression = convertRoots(expression); 
  
  // parse the string
  let i = 0;
  
  const len = expression.length,
        output = [],
        opStack = [];
    
  while(i < len) {
    let remainingExpression = expression.substring(i);
    
    // deal with numbers
    const num = remainingExpression.match(/^\-?\d+(\.\d*)?(e[+-]\d+)?/);
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




  
  





