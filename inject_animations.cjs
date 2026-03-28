const fs = require('fs');
const path = require('path');

// 1. Update CSS with beautiful animations
const cssPath = path.join(__dirname, 'src/pages/LinePortal.css');
let cssContent = fs.readFileSync(cssPath, 'utf-8');

const keyframes = `

/* =========================================
   Beautiful Entrance Animations
   ========================================= */
@keyframes floatUpFade {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.animate-fade-in {
  animation: floatUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}
.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }

/* Applying animation implicitly to major UI blocks so it looks buttery smooth */
.lp-glass, .lp-member-card, .lp-grid-actions, .lp-service-card {
  animation: floatUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.lp-header { animation-duration: 0.4s; }
.lp-member-card { animation-delay: 0.05s; opacity: 0; }
.lp-grid-actions { animation-delay: 0.15s; opacity: 0; }
.lp-service-card:nth-child(1) { animation-delay: 0.1s; opacity: 0; }
.lp-service-card:nth-child(2) { animation-delay: 0.2s; opacity: 0; }
.lp-service-card:nth-child(3) { animation-delay: 0.3s; opacity: 0; }
.lp-service-card:nth-child(n+4) { animation-delay: 0.4s; opacity: 0; }

.desktop-blocker {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  text-align: center;
  padding: 2rem;
  animation: fadeIn 0.8s ease forwards;
}
.desktop-blocker h1 {
  font-size: 2rem;
  font-weight: 900;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.desktop-blocker p {
  color: #94a3b8;
  max-width: 400px;
  line-height: 1.6;
  font-size: 1.1rem;
}
`;

if (!cssContent.includes('floatUpFade')) {
    fs.appendFileSync(cssPath, keyframes, 'utf-8');
}

// 2. Inject Desktop Block into LinePortal.jsx
const jsxPath = path.join(__dirname, 'src/pages/LinePortal.jsx');
let jsxContent = fs.readFileSync(jsxPath, 'utf-8');

// Insert isDesktop state hook
if (!jsxContent.includes('isDesktop')) {
    const targetHookLocation = `const [page, setPage] = useState('login');`;
    const newHook = `const [isDesktop, setIsDesktop] = useState(false);
    
    useEffect(() => {
        const checkWidth = () => {
            setIsDesktop(window.innerWidth > 768);
        };
        checkWidth();
        window.addEventListener('resize', checkWidth);
        return () => window.removeEventListener('resize', checkWidth);
    }, []);
    
    ${targetHookLocation}`;
    
    jsxContent = jsxContent.replace(targetHookLocation, newHook);
}

// Ensure Monitor icon is imported
if (!jsxContent.includes('MonitorSmartphone')) {
    jsxContent = jsxContent.replace('Settings', 'Settings, MonitorSmartphone');
}

// Intercept rendering early if Desktop
if (!jsxContent.includes('if (isDesktop) {')) {
    const targetRenderLocation = `if (page === 'login') {`;
    const blockerComponent = `
    // ===== DESKTOP BLOCKER =====
    if (isDesktop) {
        return (
            <div className="desktop-blocker">
                <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '2rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <MonitorSmartphone size={64} color="#10b981" style={{ margin: '0 auto 1.5rem', opacity: 0.9 }} />
                    <h1>Mobile Experience Only</h1>
                    <p>
                        ${"{pt('ciki_dental')}"} is beautifully optimized specifically for your smartphone. 
                        Please open this portal on your mobile device via the LINE application to continue.
                    </p>
                </div>
            </div>
        );
    }
    
    ${targetRenderLocation}`;
    jsxContent = jsxContent.replace(targetRenderLocation, blockerComponent);
}

fs.writeFileSync(jsxPath, jsxContent, 'utf-8');
console.log('Animation and Desktop Blocker successfully injected.');
