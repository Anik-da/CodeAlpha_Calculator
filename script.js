// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQCF3njfiuTpIMWCV9SbCAHy7-nGkxYjU",
  authDomain: "codealpha-calculator.firebaseapp.com",
  projectId: "codealpha-calculator",
  storageBucket: "codealpha-calculator.firebasestorage.app",
  messagingSenderId: "76159114380",
  appId: "1:76159114380:web:b028b07bb2dadea49eefa9",
  measurementId: "G-LLBJCB9FY6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

class Calculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.clear();
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.shouldResetScreen = false;
    }

    delete() {
        if (this.currentOperand === '0') return;
        if (this.currentOperand.length === 1) {
            this.currentOperand = '0';
            return;
        }
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
    }

    appendNumber(number) {
        if (number === '.' && this.currentOperand.includes('.')) return;
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number.toString();
        } else {
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
    }

    appendScientific(func) {
        const sciMap = {
            'sin': 'sin(',
            'cos': 'cos(',
            'tan': 'tan(',
            'sqrt': 'sqrt(',
            'pow': '^'
        };
        
        const value = sciMap[func] || func;
        
        if (this.currentOperand === '0') {
            this.currentOperand = value;
        } else {
            this.currentOperand += value;
        }
    }

    chooseOperation(operation) {
        if (this.currentOperand === '') return;
        
        // If there's already an operation and current operand is not empty, compute first
        if (this.previousOperand !== '') {
            this.compute();
        }
        
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
    }

    compute() {
        let computation;
        let expression = this.currentOperand;

        // If we are using the basic op mode (prev + current)
        if (this.operation && this.previousOperand !== '') {
            const prev = parseFloat(this.previousOperand);
            const current = parseFloat(this.currentOperand);
            if (isNaN(prev) || isNaN(current)) return;

            switch (this.operation) {
                case '+': computation = prev + current; break;
                case '-': computation = prev - current; break;
                case '×': computation = prev * current; break;
                case '÷': 
                    if (current === 0) {
                        alert("Cannot divide by zero");
                        this.clear();
                        return;
                    }
                    computation = prev / current; 
                    break;
                default: return;
            }
            this.currentOperand = computation.toString();
            this.operation = undefined;
            this.previousOperand = '';
        } else {
            // Handle scientific/complex expressions
            try {
                const result = this.evaluateExpression(this.currentOperand);
                this.previousOperand = this.currentOperand + ' =';
                this.currentOperand = result.toString();
                this.shouldResetScreen = true;
            } catch (e) {
                this.currentOperand = 'Error';
                this.shouldResetScreen = true;
            }
        }
    }

    evaluateExpression(expr) {
        // Auto-close parentheses
        let openParens = (expr.match(/\(/g) || []).length;
        let closeParens = (expr.match(/\)/g) || []).length;
        while (openParens > closeParens) {
            expr += ')';
            closeParens++;
        }

        // Map symbols
        let processedExpr = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/\^/g, '**');

        // Validation
        if (/[^0-9\+\-\*\/\.\(\)\^sin\(\)cos\(\)tan\(\)sqrt\(\)\s\*\*\,]/.test(expr)) {
            throw new Error("Invalid characters");
        }

        // Evaluate with degree-to-radian helpers
        return new Function('Math', `
            const sin = (x) => Math.sin(x * Math.PI / 180);
            const cos = (x) => Math.cos(x * Math.PI / 180);
            const tan = (x) => Math.tan(x * Math.PI / 180);
            const sqrt = (x) => Math.sqrt(x);
            try {
                return ${processedExpr};
            } catch (e) {
                return "Error";
            }
        `)(Math);
    }

    percent() {
        const current = parseFloat(this.currentOperand);
        if (isNaN(current)) return;
        this.currentOperand = (current / 100).toString();
    }

    updateDisplay() {
        const currentElement = document.getElementById('current-operand');
        const previousElement = document.getElementById('previous-operand');
        
        currentElement.innerText = this.getDisplayNumber(this.currentOperand);
        
        if (this.operation != null) {
            previousElement.innerText = `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            previousElement.innerText = this.previousOperand;
        }
    }

    getDisplayNumber(number) {
        if (number === 'Error') return 'Error';
        const stringNumber = number.toString();
        if (stringNumber.includes('(') || stringNumber.includes('sin') || stringNumber.includes('cos') || stringNumber.includes('tan')) {
            return stringNumber; // Don't format complex expressions yet
        }
        
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
        }
        
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }
}

// Initialization
const previousOperandElement = document.getElementById('previous-operand');
const currentOperandElement = document.getElementById('current-operand');
const calculator = new Calculator(previousOperandElement, currentOperandElement);

// Event Listeners
document.querySelectorAll('[data-operand]').forEach(button => {
    button.addEventListener('click', () => {
        if (calculator.shouldResetScreen) {
            calculator.currentOperand = '';
            calculator.shouldResetScreen = false;
        }
        calculator.appendNumber(button.innerText);
        calculator.updateDisplay();
    });
});

document.querySelectorAll('[data-operator]').forEach(button => {
    button.addEventListener('click', () => {
        calculator.chooseOperation(button.innerText);
        calculator.updateDisplay();
    });
});

document.querySelector('[data-equals]').addEventListener('click', () => {
    calculator.compute();
    calculator.updateDisplay();
});

document.querySelector('[data-clear]').addEventListener('click', () => {
    calculator.clear();
    calculator.updateDisplay();
});

document.querySelector('[data-delete]').addEventListener('click', () => {
    calculator.delete();
    calculator.updateDisplay();
});

document.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', () => {
        const action = button.dataset.action;
        if (action === 'percent') {
            calculator.percent();
        } else {
            if (calculator.shouldResetScreen) {
                calculator.currentOperand = '';
                calculator.shouldResetScreen = false;
            }
            calculator.appendScientific(action);
        }
        calculator.updateDisplay();
    });
});

// Scientific Toggle
const toggleBtn = document.getElementById('toggle-sci');
const sciPanel = document.getElementById('scientific-panel');

toggleBtn.addEventListener('click', () => {
    sciPanel.classList.toggle('hidden');
    toggleBtn.classList.toggle('active');
});

// Keyboard Support
window.addEventListener('keydown', e => {
    if (e.key >= 0 && e.key <= 9) {
        if (calculator.shouldResetScreen) {
            calculator.currentOperand = '';
            calculator.shouldResetScreen = false;
        }
        calculator.appendNumber(e.key);
    }
    if (e.key === '.') calculator.appendNumber('.');
    if (e.key === '=' || e.key === 'Enter') calculator.compute();
    if (e.key === 'Backspace') calculator.delete();
    if (e.key === 'Escape' || e.key === 'Delete') calculator.clear();
    if (e.key === '+') calculator.chooseOperation('+');
    if (e.key === '-') calculator.chooseOperation('-');
    if (e.key === '*') calculator.chooseOperation('×');
    if (e.key === '/') calculator.chooseOperation('÷');
    if (e.key === '%') calculator.percent();
    
    calculator.updateDisplay();
});
