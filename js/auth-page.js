import { auth } from './services/auth-service.js';

// One page for both flows: ?mode=signin shows sign-in, anything else shows sign-up.
const COPY = {
  signup: {
    title: 'Create your account',
    lead: 'Save the songs you love and build playlists that follow you everywhere.',
    submit: 'Create account',
    busy: 'Creating account…',
    switchText: 'Already have an account?',
    switchLabel: 'Sign in',
    switchHref: 'auth.html?mode=signin',
    password: 'new-password',
    pageTitle: 'VibeRoom | Create account'
  },
  signin: {
    title: 'Welcome back',
    lead: 'Sign in to pick up where you left off.',
    submit: 'Sign in',
    busy: 'Signing in…',
    switchText: 'New to VibeRoom?',
    switchLabel: 'Create an account',
    switchHref: 'auth.html',
    password: 'current-password',
    pageTitle: 'VibeRoom | Sign in'
  }
};

const mode = new URLSearchParams(location.search).get('mode') === 'signin' ? 'signin' : 'signup';
const copy = COPY[mode];

const form = document.querySelector('[data-auth-form]');
const error = document.querySelector('[data-auth-error]');
const submit = document.querySelector('[data-auth-submit]');

document.title = copy.pageTitle;
document.querySelector('[data-auth-title]').textContent = copy.title;
document.querySelector('[data-auth-lead]').textContent = copy.lead;
document.querySelector('[data-auth-switch-text]').textContent = copy.switchText;
const switchLink = document.querySelector('[data-auth-switch]');
switchLink.textContent = copy.switchLabel;
switchLink.href = copy.switchHref;
submit.textContent = copy.submit;
form.password.autocomplete = copy.password;
document.querySelectorAll('[data-signup-only]').forEach((element) => { element.hidden = mode !== 'signup'; });

// Already signed in when the page opens (Firebase remembers the session): go straight to the app.
// Only checked once, so a sign-up in progress isn't cut off before the name is saved.
auth.ready().then(() => {
  if (auth.getCurrentUser()) location.replace('home.html');
});

function validate({ displayName, email, password }) {
  if (mode === 'signup' && !displayName) return 'Enter your name.';
  if (!email || !form.email.checkValidity()) return 'Enter a valid email address.';
  if (!password) return 'Enter your password.';
  if (mode === 'signup' && password.length < 6) return 'Choose a password with at least 6 characters.';
  return '';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const values = {
    displayName: form.displayName.value.trim(),
    email: form.email.value.trim(),
    password: form.password.value
  };

  const problem = validate(values);
  error.textContent = problem;
  if (problem) return;

  submit.disabled = true;
  submit.textContent = copy.busy;
  try {
    if (mode === 'signup') {
      await auth.register(values.email, values.password, { displayName: values.displayName });
    } else {
      await auth.login(values.email, values.password);
    }
    location.replace('home.html');
  } catch (err) {
    error.textContent = err.message || 'Something went wrong. Please try again.';
    submit.disabled = false;
    submit.textContent = copy.submit;
  }
});
