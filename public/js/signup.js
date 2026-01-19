// Sign-Up Wizard State
const wizardState = {
  currentStep: 1,
  totalSteps: 6,
  data: {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    workspaceName: '',
    questionnaireAnswers: {
      goals: [],
      socialAccounts: '',
      teamSize: '',
      workspaces: ''
    },
    selectedTier: '',
    recommendedTier: '',
    userId: null,
    workspaceId: null
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeWizard();
  loadFromSessionStorage();
  setupEventListeners();
  checkURLParams();
});

function initializeWizard() {
  updateProgressBar();
  showStep(wizardState.currentStep);
}

function checkURLParams() {
  const params = new URLSearchParams(window.location.search);
  const plan = params.get('plan');

  if (plan) {
    wizardState.data.selectedTier = plan;

    // Pre-select the plan on step 4
    const planRadio = document.getElementById(`plan-${plan}`);
    if (planRadio) {
      planRadio.checked = true;
      const radioOption = planRadio.closest('.radio-option');
      if (radioOption) {
        radioOption.classList.add('selected');
      }
    }
  }
}

function setupEventListeners() {
  // Navigation buttons
  document.getElementById('nextBtn').addEventListener('click', handleNext);
  document.getElementById('prevBtn').addEventListener('click', handlePrev);

  // Radio and checkbox interactions
  setupRadioCheckboxListeners();

  // Input validation on blur
  document.getElementById('email').addEventListener('blur', validateEmail);
  document.getElementById('password').addEventListener('blur', validatePassword);
  document.getElementById('confirmPassword').addEventListener('blur', validateConfirmPassword);
}

function setupRadioCheckboxListeners() {
  // Radio buttons
  document.querySelectorAll('.radio-option').forEach(option => {
    option.addEventListener('click', function() {
      const radio = this.querySelector('input[type="radio"]');
      radio.checked = true;

      // Remove selected class from siblings
      this.parentElement.querySelectorAll('.radio-option').forEach(opt => {
        opt.classList.remove('selected');
      });

      // Add selected class to clicked option
      this.classList.add('selected');
    });
  });

  // Checkboxes
  document.querySelectorAll('.checkbox-option').forEach(option => {
    option.addEventListener('click', function(e) {
      if (e.target.tagName === 'INPUT') return; // Let input handle itself

      const checkbox = this.querySelector('input[type="checkbox"]');
      checkbox.checked = !checkbox.checked;

      if (checkbox.checked) {
        this.classList.add('selected');
      } else {
        this.classList.remove('selected');
      }
    });
  });
}

async function handleNext() {
  const currentStep = wizardState.currentStep;

  // Validate current step
  const isValid = await validateStep(currentStep);
  if (!isValid) return;

  // Save data from current step
  saveStepData(currentStep);
  saveToSessionStorage();

  // Handle special steps
  if (currentStep === 3) {
    // Calculate recommended plan after questionnaire
    calculateRecommendedPlan();
  }

  if (currentStep === 4) {
    // Create account and proceed to payment
    await createAccountAndCheckout();
    return;
  }

  // Move to next step
  if (currentStep < wizardState.totalSteps) {
    wizardState.currentStep++;
    showStep(wizardState.currentStep);
    updateProgressBar();
  }
}

function handlePrev() {
  if (wizardState.currentStep > 1) {
    wizardState.currentStep--;
    showStep(wizardState.currentStep);
    updateProgressBar();
  }
}

function showStep(step) {
  // Hide all steps
  document.querySelectorAll('.wizard-step').forEach(stepEl => {
    stepEl.classList.remove('active');
  });

  // Show current step
  const currentStepEl = document.querySelector(`.wizard-step[data-step="${step}"]`);
  if (currentStepEl) {
    currentStepEl.classList.add('active');
  }

  // Update buttons
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (step === 1) {
    prevBtn.style.display = 'none';
  } else if (step >= 5) {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
  } else {
    prevBtn.style.display = 'block';
    nextBtn.style.display = 'block';
  }

  // Update next button text
  if (step === 4) {
    nextBtn.textContent = 'Continue to Payment';
  } else {
    nextBtn.textContent = 'Next';
  }
}

function updateProgressBar() {
  document.querySelectorAll('.progress-step').forEach(step => {
    const stepNum = parseInt(step.dataset.step);

    if (stepNum < wizardState.currentStep) {
      step.classList.add('completed');
      step.classList.remove('active');
    } else if (stepNum === wizardState.currentStep) {
      step.classList.add('active');
      step.classList.remove('completed');
    } else {
      step.classList.remove('active', 'completed');
    }
  });
}

async function validateStep(step) {
  clearErrors();

  switch(step) {
    case 1:
      return validateStep1();
    case 2:
      return validateStep2();
    case 3:
      return validateStep3();
    case 4:
      return validateStep4();
    default:
      return true;
  }
}

function validateStep1() {
  let isValid = true;

  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!fullName) {
    showError('fullName', 'Full name is required');
    isValid = false;
  }

  if (!email) {
    showError('email', 'Email is required');
    isValid = false;
  } else if (!isValidEmail(email)) {
    showError('email', 'Please enter a valid email address');
    isValid = false;
  }

  if (!password) {
    showError('password', 'Password is required');
    isValid = false;
  } else if (password.length < 8) {
    showError('password', 'Password must be at least 8 characters');
    isValid = false;
  }

  if (password !== confirmPassword) {
    showError('confirmPassword', 'Passwords do not match');
    isValid = false;
  }

  return isValid;
}

function validateStep2() {
  const workspaceName = document.getElementById('workspaceName').value.trim();

  if (!workspaceName) {
    showError('workspaceName', 'Workspace name is required');
    return false;
  }

  return true;
}

function validateStep3() {
  let isValid = true;

  // Check goals (at least one)
  const goals = document.querySelectorAll('#goals input[type="checkbox"]:checked');
  if (goals.length === 0) {
    showAlert('Please select at least one goal', 'error');
    isValid = false;
  }

  // Check social accounts
  const socialAccounts = document.querySelector('input[name="socialAccounts"]:checked');
  if (!socialAccounts) {
    showAlert('Please select how many social accounts you manage', 'error');
    isValid = false;
  }

  // Check team size
  const teamSize = document.querySelector('input[name="teamSize"]:checked');
  if (!teamSize) {
    showAlert('Please select your team size', 'error');
    isValid = false;
  }

  // Check workspaces
  const workspaces = document.querySelector('input[name="workspaces"]:checked');
  if (!workspaces) {
    showAlert('Please select how many workspaces you need', 'error');
    isValid = false;
  }

  return isValid;
}

function validateStep4() {
  const selectedPlan = document.querySelector('input[name="selectedPlan"]:checked');

  if (!selectedPlan) {
    showAlert('Please select a plan', 'error');
    return false;
  }

  return true;
}

function saveStepData(step) {
  switch(step) {
    case 1:
      wizardState.data.fullName = document.getElementById('fullName').value.trim();
      wizardState.data.email = document.getElementById('email').value.trim();
      wizardState.data.password = document.getElementById('password').value;
      wizardState.data.confirmPassword = document.getElementById('confirmPassword').value;
      break;

    case 2:
      wizardState.data.workspaceName = document.getElementById('workspaceName').value.trim();
      break;

    case 3:
      // Collect goals
      const goals = Array.from(document.querySelectorAll('#goals input[type="checkbox"]:checked'))
        .map(cb => cb.value);

      wizardState.data.questionnaireAnswers = {
        goals: goals,
        socialAccounts: document.querySelector('input[name="socialAccounts"]:checked')?.value || '',
        teamSize: document.querySelector('input[name="teamSize"]:checked')?.value || '',
        workspaces: document.querySelector('input[name="workspaces"]:checked')?.value || ''
      };
      break;

    case 4:
      wizardState.data.selectedTier = document.querySelector('input[name="selectedPlan"]:checked')?.value || '';
      break;
  }
}

function calculateRecommendedPlan() {
  const answers = wizardState.data.questionnaireAnswers;
  let score = 0;

  // Goals scoring
  if (answers.goals.includes('manage-brands')) score += 20;
  if (answers.goals.includes('team-collab')) score += 15;
  if (answers.goals.includes('analytics')) score += 10;

  // Social accounts scoring
  if (answers.socialAccounts === '1-3') score += 5;
  if (answers.socialAccounts === '4-10') score += 15;
  if (answers.socialAccounts === '10+') score += 25;

  // Team size scoring
  if (answers.teamSize === 'solo') score += 0;
  if (answers.teamSize === 'small') score += 10;
  if (answers.teamSize === 'medium') score += 20;
  if (answers.teamSize === 'large') score += 25;

  // Workspaces scoring
  if (answers.workspaces === '1') score += 5;
  if (answers.workspaces === '2-4') score += 15;
  if (answers.workspaces === '5+') score += 25;

  // Determine recommended tier
  let recommendedTier;
  if (score <= 15) {
    recommendedTier = 'solo';
  } else if (score <= 30) {
    recommendedTier = 'pro';
  } else if (score <= 50) {
    recommendedTier = 'pro-plus';
  } else {
    recommendedTier = 'agency';
  }

  wizardState.data.recommendedTier = recommendedTier;

  // Display recommendation
  const planNames = {
    'solo': 'Solo',
    'pro': 'Pro',
    'pro-plus': 'Pro Plus',
    'agency': 'Agency'
  };

  document.getElementById('recommended-plan').textContent = planNames[recommendedTier];

  // Pre-select recommended plan
  const recommendedRadio = document.getElementById(`plan-${recommendedTier}`);
  if (recommendedRadio && !document.querySelector('input[name="selectedPlan"]:checked')) {
    recommendedRadio.checked = true;
    const radioOption = recommendedRadio.closest('.radio-option');
    if (radioOption) {
      radioOption.classList.add('selected');
    }
  }
}

async function createAccountAndCheckout() {
  try {
    // Move to processing step
    wizardState.currentStep = 5;
    showStep(5);
    updateProgressBar();

    // Disable next button
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.disabled = true;
    nextBtn.classList.add('btn-disabled');

    // Create account
    const response = await fetch('/api/create-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fullName: wizardState.data.fullName,
        email: wizardState.data.email,
        password: wizardState.data.password,
        workspaceName: wizardState.data.workspaceName,
        questionnaireAnswers: wizardState.data.questionnaireAnswers,
        selectedTier: wizardState.data.selectedTier
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create account');
    }

    // Save user and workspace IDs
    wizardState.data.userId = data.userId;
    wizardState.data.workspaceId = data.workspaceId;

    // Create Stripe checkout session
    const checkoutResponse = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: data.userId,
        workspaceId: data.workspaceId,
        tier: wizardState.data.selectedTier,
        email: wizardState.data.email,
        fullName: wizardState.data.fullName
      })
    });

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      throw new Error(checkoutData.message || 'Failed to create checkout session');
    }

    // Move to step 6
    wizardState.currentStep = 6;
    showStep(6);
    updateProgressBar();

    // Redirect to Stripe checkout
    setTimeout(() => {
      window.location.href = checkoutData.checkoutUrl;
    }, 1500);

  } catch (error) {
    console.error('Error:', error);
    showAlert(error.message || 'Something went wrong. Please try again.', 'error');

    // Go back to step 4
    wizardState.currentStep = 4;
    showStep(4);
    updateProgressBar();

    // Re-enable next button
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.disabled = false;
    nextBtn.classList.remove('btn-disabled');
  }
}

// Utility functions
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

async function validateEmail() {
  const email = document.getElementById('email').value.trim();

  if (!email || !isValidEmail(email)) return;

  try {
    const response = await fetch('/api/validate-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const result = await response.json();

    // API returns { success: true, data: { available: true/false } }
    const available = result.data?.available ?? result.available;

    if (!available) {
      showError('email', 'This email is already registered');
    }
  } catch (error) {
    console.error('Email validation error:', error);
  }
}

function validatePassword() {
  const password = document.getElementById('password').value;

  if (password && password.length < 8) {
    showError('password', 'Password must be at least 8 characters');
  }
}

function validateConfirmPassword() {
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (confirmPassword && password !== confirmPassword) {
    showError('confirmPassword', 'Passwords do not match');
  }
}

function showError(fieldId, message) {
  const errorEl = document.getElementById(`${fieldId}-error`);
  if (errorEl) {
    errorEl.textContent = message;
  }

  const inputEl = document.getElementById(fieldId);
  if (inputEl) {
    inputEl.style.borderColor = 'var(--error-color)';
  }
}

function clearErrors() {
  document.querySelectorAll('.form-error').forEach(el => {
    el.textContent = '';
  });

  document.querySelectorAll('input, textarea, select').forEach(el => {
    el.style.borderColor = '';
  });

  // Clear alerts
  const alertContainer = document.getElementById('alert-container');
  if (alertContainer) {
    alertContainer.innerHTML = '';
  }
}

function showAlert(message, type = 'info') {
  const alertContainer = document.getElementById('alert-container');

  const alertEl = document.createElement('div');
  alertEl.className = `alert alert-${type}`;
  alertEl.textContent = message;

  alertContainer.innerHTML = '';
  alertContainer.appendChild(alertEl);

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    alertEl.remove();
  }, 5000);
}

function saveToSessionStorage() {
  sessionStorage.setItem('wizardState', JSON.stringify(wizardState));
}

function loadFromSessionStorage() {
  const saved = sessionStorage.getItem('wizardState');

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(wizardState, parsed);

      // Restore form values
      if (wizardState.data.fullName) {
        document.getElementById('fullName').value = wizardState.data.fullName;
      }
      if (wizardState.data.email) {
        document.getElementById('email').value = wizardState.data.email;
      }
      if (wizardState.data.workspaceName) {
        document.getElementById('workspaceName').value = wizardState.data.workspaceName;
      }
    } catch (e) {
      console.error('Failed to load wizard state:', e);
    }
  }
}
