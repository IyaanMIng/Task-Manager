// Get references to buttons and form containers
const signUpButton = document.getElementById('signUpButton');
const signInButton = document.getElementById('signInButton');
const signInForm = document.getElementById('signIn');
const signUpForm = document.getElementById('signup');

// Ensure that the Sign-In form is visible initially, and Sign-Up form is hidden
// Toggle Sign Up and Sign In forms
// Toggle Sign Up and Sign In forms
document.addEventListener("DOMContentLoaded", function () {
    const signUpButton = document.getElementById("signUpButton");
    const signInButton = document.getElementById("signInButton");
    const signInForm = document.getElementById("signIn");
    const signUpForm = document.getElementById("signup");
  
    if (signUpButton && signInButton) {
      signUpButton.addEventListener("click", () => {
        signInForm.style.display = "none";
        signUpForm.style.display = "block";
      });
  
      signInButton.addEventListener("click", () => {
        signUpForm.style.display = "none";
        signInForm.style.display = "block";
      });
    }
  });
