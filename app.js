document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const mixGradeSelect = document.getElementById('mix-grade');
    const wcRatioInput = document.getElementById('wc-ratio');
    const spUsedToggle = document.getElementById('sp-used');
    const spParamsDiv = document.getElementById('sp-params');
    const spSGGroup = document.getElementById('sp-sg-group');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsPlaceholder = document.getElementById('results-placeholder');
    const resultsContent = document.getElementById('results-content');
    
    // Auth Elements
    const loginScreen = document.getElementById('login-screen');
    const appWrapper = document.querySelector('.app-wrapper');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const loginError = document.getElementById('login-error');
    
    // Credentials
    const VALID_EMAIL = 'mhpbuilders0579@gmail.com';
    const VALID_PASS = 'MHPBUILDERS0579';

    // ── AUTH CHECKING ──
    function checkAuth() {
        const session = localStorage.getItem('mhp_session');
        if (session === 'active') {
            showApp();
        } else {
            showLogin();
        }
    }

    function showApp() {
        loginScreen.classList.add('login-exit');
        setTimeout(() => {
            loginScreen.classList.add('hidden');
            appWrapper.classList.remove('hidden');
            appWrapper.classList.add('app-fade-in');
        }, 400); // match animation duration
    }

    function showLogin() {
        loginScreen.classList.remove('hidden');
        appWrapper.classList.add('hidden');
    }

    // ── AUTH HANDLERS ──
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        const btn = loginForm.querySelector('.lf-btn');
        const btnText = btn ? btn.querySelector('.lf-btn-text') : null;

        // Visual feedback: Loading state
        if (btn) btn.disabled = true;
        if (btnText) btnText.innerText = 'Verifying...';

        setTimeout(() => {
            if (email === VALID_EMAIL && pass === VALID_PASS) {
                localStorage.setItem('mhp_session', 'active');
                if (loginError) loginError.classList.add('hidden');
                showApp();
            } else {
                if (loginError) loginError.classList.remove('hidden');
                if (btn) btn.disabled = false;
                if (btnText) btnText.innerText = 'Sign In';

                // Shake effect
                loginScreen.querySelector('.login-box').animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-10px)' },
                    { transform: 'translateX(10px)' },
                    { transform: 'translateX(0)' }
                ], { duration: 300 });
            }
        }, 700);
    });

    // Password Toggle Logic
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('login-password');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const isPassword = passwordInput.type === 'password';
            passwordInput.type = isPassword ? 'text' : 'password';
            const eyeIcon = document.getElementById('eye-icon');
            if (eyeIcon) {
                eyeIcon.innerHTML = isPassword
                    ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
                    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
            }
            togglePasswordBtn.title = isPassword ? 'Hide Password' : 'Show Password';
        });
    }

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('mhp_session');
        window.location.reload(); // Hard reload to clear any sensitive state
    });

    // Run initial check
    checkAuth();

    let hasCalculated = false; // track whether results have been generated

    // Default W/C Ratios
    const wcDefaults = {
        'M10': 0.60,
        'M15': 0.55,
        'M20': 0.50,
        'M25': 0.45,
        'M30': 0.40,
        'M35': 0.38,
        'M40': 0.36,
        'M45': 0.34,
        'M50': 0.32,
        'M55': 0.30,
        'M60': 0.28
    };

    // Listeners
    mixGradeSelect.addEventListener('change', (e) => {
        wcRatioInput.value = wcDefaults[e.target.value] || 0.45;
    });

    spUsedToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            spParamsDiv.classList.remove('hidden');
            spSGGroup.classList.remove('hidden');
        } else {
            spParamsDiv.classList.add('hidden');
            spSGGroup.classList.add('hidden');
        }
    });

    calculateBtn.addEventListener('click', calculateMix);

    function calculateMix() {
        // Collect Inputs
        const mixGrade = mixGradeSelect.value;
        const wcRatio = parseFloat(wcRatioInput.value);
        const spUsed = spUsedToggle.checked;
        const spDosagePercent = parseFloat(document.getElementById('sp-dosage').value) || 0;
        const totalVolRequired = parseFloat(document.getElementById('concrete-vol').value);
        
        const sgCement = parseFloat(document.getElementById('sg-cement').value);
        const sgFA = parseFloat(document.getElementById('sg-fa').value);
        const sgCA = parseFloat(document.getElementById('sg-ca').value);
        const sgSP = parseFloat(document.getElementById('sg-sp').value);
        
        const aggRatioVal = document.getElementById('agg-ratio').value;
        const [caPercent, faPercent] = aggRatioVal.split('-').map(v => parseInt(v) / 100);

        // Core Constants (Per User Requirement)
        // Water content for 100mm slump is 197.1 Liter
        // If SP used, reduce 20% to 150 Liter
        const waterContentPerM3 = spUsed ? 150 : 197.1;

        // 1. Calculate Cement Content (KG/m3)
        // Formula: Cement Content = Water / W/C Ratio
        const cementContentPerM3 = waterContentPerM3 / wcRatio;

        // 2. Calculate SP Amount (KG/m3)
        let spMassPerM3 = 0;
        if (spUsed) {
            spMassPerM3 = (spDosagePercent / 100) * cementContentPerM3;
        }

        // 3. Calculate Volumes (m3)
        const volCement = cementContentPerM3 / (sgCement * 1000);
        const volWater = waterContentPerM3 / 1000;
        const volSP = spUsed ? (spMassPerM3 / (sgSP * 1000)) : 0;

        // Volume of Aggregate = 1 - Sum of (Vol Cement, Vol Water, Vol SP)
        // User stated: SUM OF (VOLUME OF CEMENT,VOLUME OF SUPER PLASTICIZER, WATER)-1 
        // This usually means Abs(Sum - 1) or 1 - Sum. We'll use 1 - Sum for 1 m3 volume.
        const volAggregateTotal = 1 - (volCement + volWater + volSP);

        // 4. Split Aggregates
        const volCA = volAggregateTotal * caPercent;
        const volFA = volAggregateTotal * faPercent;

        // 5. Calculate Masses (KG/m3)
        const massFA = volFA * sgFA * 1000;
        const massCA = volCA * sgCA * 1000;

        // 6. Scale by Required Volume
        const finalCementKG = cementContentPerM3 * totalVolRequired;
        const finalWaterL = waterContentPerM3 * totalVolRequired;
        const finalSPKG = spMassPerM3 * totalVolRequired;
        const finalFAKG = massFA * totalVolRequired;
        const finalCAKG = massCA * totalVolRequired;

        const finalFACUM = volFA * totalVolRequired;
        const finalCACUM = volCA * totalVolRequired;

        // Conversions
        const bags = finalCementKG / 50;
        const cftFactor = 35.3147;
        const unitFactor = 100; // 1 Unit = 100 CFT

        const finalFACFT = finalFACUM * cftFactor;
        const finalCACFT = finalCACUM * cftFactor;

        const finalFAUnit = finalFACFT / unitFactor;
        const finalCAUnit = finalCACFT / unitFactor;

        // 7. Ratios (C : FA : CA)
        const ratC = 1;
        const ratFA = massFA / cementContentPerM3;
        const ratCA = massCA / cementContentPerM3;

        // Update UI
        resultsPlaceholder.classList.add('hidden');
        resultsContent.classList.remove('hidden');
        hasCalculated = true;

        document.getElementById('res-final-ratio').innerText = `1 : ${ratFA.toFixed(2)} : ${ratCA.toFixed(2)}`;
        document.getElementById('res-wc-display').innerText = `W/C Ratio: ${wcRatio.toFixed(2)}`;

        // Update grade badge
        const gradeBadge = document.getElementById('res-grade-badge');
        if (gradeBadge) gradeBadge.innerText = mixGrade;
        
        document.getElementById('res-cement-kg').innerText = finalCementKG.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('res-cement-bags').innerText = `${bags.toFixed(1)} Bags (50 kg each)`;
        
        document.getElementById('res-water-l').innerText = finalWaterL.toFixed(1);
        
        document.getElementById('res-fa-kg').innerText = finalFAKG.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        document.getElementById('res-ca-kg').innerText = finalCAKG.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});

        const spCard = document.getElementById('res-sp-card');
        if (spUsed) {
            spCard.classList.remove('hidden');
            const spLiters = finalSPKG / sgSP;
            document.getElementById('res-sp-kg').innerText = `${finalSPKG.toFixed(2)} KG / ${spLiters.toFixed(2)} L`;
        } else {
            spCard.classList.add('hidden');
        }

        document.getElementById('res-vol-title').innerText = totalVolRequired;
        
        document.getElementById('res-fa-cum').innerText = finalFACUM.toFixed(3);
        document.getElementById('res-fa-cft').innerText = finalFACFT.toFixed(2);
        document.getElementById('res-fa-unit').innerText = finalFAUnit.toFixed(2);

        document.getElementById('res-ca-cum').innerText = finalCACUM.toFixed(3);
        document.getElementById('res-ca-cft').innerText = finalCACFT.toFixed(2);
        document.getElementById('res-ca-unit').innerText = finalCAUnit.toFixed(2);

        // Update proportional visualizer bar
        const totalMass = cementContentPerM3 + massFA + massCA;
        const cPct  = ((cementContentPerM3 / totalMass) * 100).toFixed(1);
        const faPct = ((massFA / totalMass) * 100).toFixed(1);
        const caPct = ((massCA / totalMass) * 100).toFixed(1);
        const vizCement = document.getElementById('viz-cement');
        const vizFA     = document.getElementById('viz-fa');
        const vizCA     = document.getElementById('viz-ca');
        if (vizCement) { vizCement.style.width = cPct + '%';  vizCement.querySelector('span').innerText = cPct + '%'; }
        if (vizFA)     { vizFA.style.width     = faPct + '%'; vizFA.querySelector('span').innerText     = faPct + '%'; }
        if (vizCA)     { vizCA.style.width     = caPct + '%'; vizCA.querySelector('span').innerText     = caPct + '%'; }

        // Populate Professional Report (Print Only)
        populateProfessionalReport({
            mixGrade, wcRatio, totalVolRequired, spUsed, spDosagePercent,
            sgCement, sgFA, sgCA, sgSP,
            finalCementKG, bags, finalWaterL, finalFAKG, finalCAKG, finalSPKG,
            ratFA, ratCA,
            finalFACUM, finalFACFT, finalFAUnit,
            finalCACUM, finalCACFT, finalCAUnit
        });

        // Smooth scroll to results (mobile-friendly)
        resultsContent.closest('.panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function populateProfessionalReport(data) {
        // Date
        const now = new Date();
        document.getElementById('report-date').innerText = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Inputs
        document.getElementById('rep-mix').innerText = data.mixGrade;
        document.getElementById('rep-wc').innerText = data.wcRatio.toFixed(2);
        document.getElementById('rep-vol').innerText = data.totalVolRequired.toFixed(1);
        document.getElementById('rep-sp-used').innerText = data.spUsed ? `Used (${data.spDosagePercent}%)` : 'Not Used';
        
        // Outputs
        document.getElementById('rep-cement').innerText = `${data.finalCementKG.toFixed(2)} KG (${data.bags.toFixed(1)} Bags)`;
        document.getElementById('rep-water').innerText = `${data.finalWaterL.toFixed(1)} Liters`;
        
        // Fine Aggregate
        document.getElementById('rep-fa-kg').innerText   = data.finalFAKG.toFixed(2);
        document.getElementById('rep-fa-cum').innerText  = data.finalFACUM.toFixed(3);
        document.getElementById('rep-fa-cft').innerText  = data.finalFACFT.toFixed(2);
        document.getElementById('rep-fa-unit').innerText = data.finalFAUnit.toFixed(2);

        // Coarse Aggregate
        document.getElementById('rep-ca-kg').innerText   = data.finalCAKG.toFixed(2);
        document.getElementById('rep-ca-cum').innerText  = data.finalCACUM.toFixed(3);
        document.getElementById('rep-ca-cft').innerText  = data.finalCACFT.toFixed(2);
        document.getElementById('rep-ca-unit').innerText = data.finalCAUnit.toFixed(2);
        
        const spRow = document.getElementById('rep-sp-row');
        if (data.spUsed) {
            spRow.style.display = '';          // restore default table-row
            const spLiters = data.finalSPKG / data.sgSP;
            document.getElementById('rep-sp').innerText = `${data.finalSPKG.toFixed(2)} KG / ${spLiters.toFixed(2)} Liters`;
        } else {
            spRow.style.display = 'none';
        }

        // Ratio
        document.getElementById('rep-final-ratio').innerText = `1 : ${data.ratFA.toFixed(2)} : ${data.ratCA.toFixed(2)} (W/C: ${data.wcRatio.toFixed(2)})`;

        // Table
        document.getElementById('rep-fa-cum').innerText = data.finalFACUM.toFixed(3);
        document.getElementById('rep-fa-cft').innerText = data.finalFACFT.toFixed(2);
        document.getElementById('rep-fa-unit').innerText = data.finalFAUnit.toFixed(2);

        document.getElementById('rep-ca-cum').innerText = data.finalCACUM.toFixed(3);
        document.getElementById('rep-ca-cft').innerText = data.finalCACFT.toFixed(2);
        document.getElementById('rep-ca-unit').innerText = data.finalCAUnit.toFixed(2);
    }

    // Set current date for print
    function updatePrintDate() {
        // Handled in populateProfessionalReport now
    }

    // Print Functionality
    document.getElementById('print-btn').addEventListener('click', () => {
        if (!hasCalculated) {
            // Auto-calculate first so the report is populated
            calculateMix();
        }
        // Small delay lets the DOM update complete before the print dialog opens
        setTimeout(() => window.print(), 120);
    });
});
