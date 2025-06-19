document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'https://golden-income-website.onrender.com/api';  // Ensure this matches your backend server URL

    // --- Registration Form Submission ---
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            const formData = new FormData(registrationForm);
            const data = {};
            for (const [key, value] of formData.entries()) {
                if (key === 'interests') { // Handle multiple checkboxes with the same name
                    if (!data[key]) {
                        data[key] = [];
                    }
                    data[key].push(value);
                } else if (key === 'has_trade_knowledge') {
                    data[key] = true; // Checkbox is only submitted if checked
                } else {
                    data[key] = value;
                }
            }
            // Ensure has_trade_knowledge is false if checkbox was not checked
            if (!data.has_trade_knowledge) {
                data.has_trade_knowledge = false;
            }

            console.log('Registering user with data:', data);

            try {
                const response = await fetch(`${BACKEND_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (response.ok) { // Check if HTTP status is 2xx
                    alert(result.message);
                    // Store the referral link in localStorage
                    localStorage.setItem('goldenIncomeReferralLink', result.referralLink);
                    window.location.href = 'referral.html';
                } else {
                    alert('Registration failed: ' + result.message);
                }
            } catch (error) {
                console.error('Error during registration:', error);
                alert('An error occurred during registration. Please try again.');
            }
        });
    }

    // --- Login Form Submission ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const loginMessage = document.querySelector('.login-message');
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const identifier = document.getElementById('identifier').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch(`${BACKEND_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ identifier, password }),
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    // Store the referral link in localStorage
                    localStorage.setItem('goldenIncomeReferralLink', result.referralLink);
                    window.location.href = 'referral.html';
                } else {
                    loginMessage.textContent = 'Login failed: ' + result.message;
                    loginMessage.style.color = 'red';
                }
            } catch (error) {
                console.error('Error during login:', error);
                loginMessage.textContent = 'An error occurred during login. Please try again.';
                loginMessage.style.color = 'red';
            }
        });
    }

    // --- Referral Link Display and Copy Function (for referral.html) ---
    const referralLinkPlaceholder = document.getElementById('brokerReferralLinkPlaceholder');
    if (referralLinkPlaceholder) {
        const storedReferralLink = localStorage.getItem('goldenIncomeReferralLink');
        if (storedReferralLink) {
            referralLinkPlaceholder.innerHTML = `<a href="${storedReferralLink}" target="_blank" rel="noopener noreferrer">${storedReferralLink}</a>`;
        } else {
            referralLinkPlaceholder.innerHTML = `No referral link found. Please <a href="register.html">register</a> or <a href="login.html">login</a>.`;
            // Optional: Redirect to login if no link is found to ensure access control
            // window.location.href = 'login.html'; 
        }
    }

    window.copyReferralLink = function() {
        const linkElement = referralLinkPlaceholder.querySelector('a');
        if (linkElement) {
            const tempInput = document.createElement('input');
            tempInput.value = linkElement.href;
            document.body.appendChild(tempInput);
            
            tempInput.select();
            tempInput.setSelectionRange(0, 99999); 
            document.execCommand('copy');
            
            document.body.removeChild(tempInput);
            
            alert('Referral link copied to clipboard!');
        } else {
            alert('No referral link to copy!');
        }
    };

    // --- Pip Value Calculator Logic (for tools.html) ---
    window.calculatePipValue = function() {
        const pair = document.getElementById('calcPair').value;
        const lots = parseFloat(document.getElementById('calcLots').value);
        const accountCurrency = document.getElementById('calcAccountCurrency').value;
        const resultElement = document.getElementById('pipValueResult');

        if (isNaN(lots) || lots <= 0) {
            resultElement.innerText = 'Please enter a valid trade size.';
            return;
        }

        let pipValueUSD = 0; 

        const fxRates = {
            'EURUSD': 1.0850, 'GBPUSD': 1.2500, 'USDJPY': 145.00,
            'AUDUSD': 0.6500, 'NZDUSD': 0.6000, 'USDCAD': 1.3600,
            'USDCHF': 0.9000, 'EURJPY': 157.30, 'GBPJPY': 181.25
        };

        const conversionRatesToUSD = {
            'USD': 1, 'EUR': 1.0850, 'GBP': 1.2500,
            'JPY': 1 / 145.00, 'AUD': 0.6500, 'CAD': 1 / 1.3600,
            'CHF': 1 / 0.9000, 'INR': 1 / 83.50 
        };

        if (pair.includes('JPY')) {
            const usdJpyRate = fxRates['USDJPY'] || 145.00;
            pipValueUSD = (1000 / usdJpyRate) * lots;
        } else if (pair.includes('USD') && pair.indexOf('USD') === pair.length - 3) {
            pipValueUSD = 10 * lots;
        } else if (pair.includes('USD') && pair.indexOf('USD') === 0) {
            pipValueUSD = 10 * lots; 
        } else {
            const quoteCurrency = pair.slice(-3);
            if (quoteCurrency === 'JPY') {
                 const usdJpyRate = fxRates['USDJPY'] || 145.00;
                 pipValueUSD = (1000 / usdJpyRate) * lots;
            } else {
                pipValueUSD = 10 * lots; 
            }
        }
        
        let finalPipValue = pipValueUSD * conversionRatesToUSD[accountCurrency];

        resultElement.innerHTML = `<strong>${finalPipValue.toFixed(2)} ${accountCurrency}</strong> per pip`;
    };
});