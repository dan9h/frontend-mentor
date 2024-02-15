const VALUE_MISSING = 0;
const OUT_OF_RANGE = 1;
const INVALID_DATE = 2;
const FUTURE_DATE = 3;

const form = document.querySelector('#ac-form');
const inputs = document.querySelectorAll('.field__input');

// set the max constraint of the year field to current year
inputs[2].max = new Date().getFullYear();

form.addEventListener('submit', (event) => {
  event.preventDefault();

  let hasError = false;

  inputs.forEach((input) => {
    if (isEmpty(input)) {
      showError(input, VALUE_MISSING);
      hasError = true;
    } else if (isOutOfRange(input)) {
      showError(input, OUT_OF_RANGE);
      hasError = true;
    } else {
      hideError(input);
    }
  });

  if (hasError) return;

  const [day, month, year] = [...inputs].map((input) => input.value);

  if (isValidDate(year, month, day)) {
    if (isFutureDate(year, month, day)) {
      showAllError(FUTURE_DATE);
      return;
    }
    const inputDate = new Date(year, month - 1, day);
    const currentDate = new Date();
    const dateDifference = getDateDifference(inputDate, currentDate);

    showResult(dateDifference);
  } else {
    showAllError(INVALID_DATE);
  }
});

function showResult({ years, months, days }) {
  const [yearsNode, monthsNode, daysNode] =
    document.querySelectorAll('.result__count');

  updateResult(yearsNode, years);
  updateResult(monthsNode, months);
  updateResult(daysNode, days);
}

function updateResult(targetResultNode, count) {
  let currentCount = parseInt(targetResultNode.dataset.value);
  let i = currentCount < count ? 1 : -1;

  const interval = setInterval(() => {
    targetResultNode.innerText = currentCount;
    targetResultNode.dataset.value = currentCount;

    if (currentCount === count) {
      clearInterval(interval);

      const labelNode = targetResultNode.nextElementSibling;
      const label = labelNode.dataset.label;
      labelNode.innerText = count === 1 ? label : label + 's';
    }
    currentCount += i;
  }, 1000 / 60);
}

function showAllError(errorType) {
  showError(inputs[0], errorType);
  showError(inputs[1]);
  showError(inputs[2]);
}

function showError(targetInput, errorType) {
  const targetLabel = targetInput.previousElementSibling;
  const targetErrorText = targetInput.nextElementSibling;

  let errorMessage;

  switch (errorType) {
    case VALUE_MISSING:
      errorMessage = 'This field is required';
      break;
    case OUT_OF_RANGE:
      if (targetInput.id === 'year') {
        errorMessage = 'Must be in the past';
      } else {
        errorMessage = `Must be a valid ${targetInput.id}`;
      }
      break;
    case INVALID_DATE:
      errorMessage = 'Must be a valid date';
      break;
    case FUTURE_DATE:
      errorMessage = 'Must be in the past';
      break;
    default:
      errorMessage = '';
      break;
  }

  targetLabel.classList.add('field__label--error');
  targetInput.classList.add('field__input--error');
  targetErrorText.textContent = errorMessage;

  if (errorMessage) {
    targetErrorText.classList.add('active');
  }
}

function hideError(targetInput) {
  const targetLabel = targetInput.previousElementSibling;
  const targetErrorText = targetInput.nextElementSibling;

  targetLabel.classList.remove('field__label--error');
  targetInput.classList.remove('field__input--error');
  targetErrorText.classList.remove('active');
  targetErrorText.textContent = '';
}

inputs.forEach((input) => {
  // triggers when the input value changes
  input.addEventListener('input', (event) => {
    /**
     * maxlength attribute is ignored on input[type="number"]
     * so we had to set the maxlength as a dataset to control it
     */
    if (input.value.length >= input.dataset.maxlength) {
      input.value = input.value.slice(0, input.dataset.maxlength);
    }

    if (isOutOfRange(input)) {
      showError(input, OUT_OF_RANGE);
    } else {
      hideError(input);
    }
  });

  input.addEventListener('keydown', handleKeydown);
});

function handleKeydown(event) {
  /**
   * number inputs also accepts the letter 'e'
   * this ensures that user can only input numbers
   * but still be able to use the following keys:
   * Backspace[8], Tab[9], Delete[46], and Arrows[37-40]
   */
  const { key, keyCode } = event;
  const acceptableKeyCodes = [8, 9, 46, 37, 38, 39, 40];

  if (!/[0-9]/.test(key) && !acceptableKeyCodes.includes(keyCode)) {
    event.preventDefault();
  }
}

function isEmpty(targetInput) {
  return targetInput.validity.valueMissing;
}

function isOutOfRange(targetInput) {
  return (
    targetInput.validity.rangeUnderflow || targetInput.validity.rangeOverflow
  );
}

function isFutureDate(year, month, day) {
  return new Date(year, month - 1, day) > new Date();
}

/**
 * Calculate the difference of two dates
 * @param  Date   dateA Any date in the past
 * @param  Date   dateB The current date
 * @return {}           The difference in years, months, and days
 */
function getDateDifference(dateA, dateB) {
  const [dateAYear, dateAMonth, dateADay] = [
    dateA.getYear(),
    dateA.getMonth(),
    dateA.getDate(),
  ];
  const [dateBYear, dateBMonth, dateBDay] = [
    dateB.getYear(),
    dateB.getMonth(),
    dateB.getDate(),
  ];

  let yearDiff = dateBYear - dateAYear;
  let monthDiff = 0;
  let dayDiff = 0;

  if (dateBMonth >= dateAMonth) {
    monthDiff = dateBMonth - dateAMonth;
  } else {
    yearDiff--;
    monthDiff = 12 + dateBMonth - dateAMonth;
  }

  if (dateBDay >= dateADay) {
    dayDiff = dateBDay - dateADay;
  } else {
    monthDiff--;
    dayDiff = 31 + dateBDay - dateADay;

    if (monthDiff < 0) {
      monthDiff = 11;
      yearDiff--;
    }
  }

  return {
    years: yearDiff,
    months: monthDiff,
    days: dayDiff,
  };
}

/**
 * Get the number of days in any particular month
 * @link https://stackoverflow.com/a/1433119/1293256
 * @param  Integer year  The year
 * @param  Integer month The month (valid: 0-11)
 * @return Integer       The number of days in the month
 */
const daysInMonth = function (year, month) {
  switch (month) {
    case 1:
      return (year % 4 == 0 && year % 100) || year % 400 == 0 ? 29 : 28;
    case 8:
    case 3:
    case 5:
    case 10:
      return 30;
    default:
      return 31;
  }
};

/**
 * Check if a date is valid
 * @link https://stackoverflow.com/a/1433119/1293256
 * @param  Integer  year  The year
 * @param  Integer  month The month
 * @param  Integer  day   The day
 * @return Boolean        Returns true if valid
 */
function isValidDate(year, month, day) {
  month = parseInt(month, 10) - 1;
  return month >= 0 && month < 12 && day > 0 && day <= daysInMonth(year, month);
}
