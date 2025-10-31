import React from 'react';
import GlassCard from '../../Components/common/GlassCard/GlassCard';
import { 
    formatIndianCurrency, 
    formatIndianNumber, 
    formatPriceRange,
    calculateGST,
    calculateDiscount,
    indianTerms,
    getLocalizedTerm,
    formatIndianDate,
    formatDistance,
    formatDuration
} from '../../utils/indianLocalization';
import './DesignShowcase.scss';

const DesignShowcase = () => {
    return (
        <div className="design-showcase">
            <div className="container">
                {/* Header */}
                <section className="showcase-section">
                    <h1 className="showcase-title">
                        🇮🇳 Safarnama Design System
                    </h1>
                    <p className="showcase-subtitle">
                        Indian-Themed Eco-Tourism Design
                    </p>
                </section>

                {/* Color Palette */}
                <section className="showcase-section">
                    <h2>🎨 Color Palette</h2>
                    
                    <h3>Indian Flag Colors</h3>
                    <div className="color-grid">
                        <div className="color-box" style={{background: 'var(--saffron)'}}>
                            <span>Saffron</span>
                            <code>#FF9933</code>
                        </div>
                        <div className="color-box" style={{background: 'var(--india-white)', border: '2px solid #ddd'}}>
                            <span style={{color: '#000'}}>White</span>
                            <code style={{color: '#000'}}>#FFFFFF</code>
                        </div>
                        <div className="color-box" style={{background: 'var(--india-green)'}}>
                            <span>Green</span>
                            <code>#138808</code>
                        </div>
                        <div className="color-box" style={{background: 'var(--ashoka-blue)'}}>
                            <span>Ashoka Blue</span>
                            <code>#000080</code>
                        </div>
                    </div>

                    <h3>Nature Colors</h3>
                    <div className="color-grid">
                        <div className="color-box" style={{background: 'var(--forest-green)'}}>
                            <span>Forest</span>
                            <code>#2d5016</code>
                        </div>
                        <div className="color-box" style={{background: 'var(--sky-blue)'}}>
                            <span style={{color: '#000'}}>Sky Blue</span>
                            <code style={{color: '#000'}}>#87ceeb</code>
                        </div>
                        <div className="color-box" style={{background: 'var(--earth-brown)'}}>
                            <span>Earth</span>
                            <code>#8B4513</code>
                        </div>
                        <div className="color-box" style={{background: 'var(--golden-yellow)'}}>
                            <span style={{color: '#000'}}>Gold</span>
                            <code style={{color: '#000'}}>#FFD700</code>
                        </div>
                    </div>
                </section>

                {/* Buttons */}
                <section className="showcase-section">
                    <h2>🔘 Buttons</h2>
                    <div className="button-showcase">
                        <button className="btn">Primary Button</button>
                        <button className="primary_button">Secondary Button</button>
                        <button className="secondary_button">Outlined Button</button>
                        <button className="btn" disabled>Disabled Button</button>
                    </div>
                </section>

                {/* Glass Cards */}
                <section className="showcase-section">
                    <h2>🪟 Glassmorphism Cards</h2>
                    <div className="card-grid">
                        <GlassCard hover={true}>
                            <h3>Default Glass Card</h3>
                            <p>Subtle glass effect with hover animation</p>
                        </GlassCard>

                        <GlassCard className="glass-card-eco" hover={true}>
                            <h3>Eco Theme</h3>
                            <p>Green-tinted glass for nature content</p>
                        </GlassCard>

                        <GlassCard className="glass-card-saffron" hover={true}>
                            <h3>Saffron Theme</h3>
                            <p>Warm saffron tint for featured content</p>
                        </GlassCard>

                        <GlassCard className="glass-card-india" hover={true}>
                            <h3>India Border</h3>
                            <p>Tricolor gradient border</p>
                        </GlassCard>
                    </div>
                </section>

                {/* Indian Currency */}
                <section className="showcase-section">
                    <h2>💰 Indian Currency Formatting</h2>
                    <div className="example-grid">
                        <div className="example-box">
                            <h4>Basic Amount</h4>
                            <p className="result">{formatIndianCurrency(5000)}</p>
                            <code>formatIndianCurrency(5000)</code>
                        </div>

                        <div className="example-box">
                            <h4>Lakh</h4>
                            <p className="result">{formatIndianCurrency(150000)}</p>
                            <code>formatIndianCurrency(150000)</code>
                        </div>

                        <div className="example-box">
                            <h4>Crore</h4>
                            <p className="result">{formatIndianCurrency(10000000)}</p>
                            <code>formatIndianCurrency(10000000)</code>
                        </div>

                        <div className="example-box">
                            <h4>Price Range</h4>
                            <p className="result">{formatPriceRange(5000, 15000)}</p>
                            <code>formatPriceRange(5000, 15000)</code>
                        </div>
                    </div>
                </section>

                {/* Number Formatting */}
                <section className="showcase-section">
                    <h2>🔢 Number Formatting</h2>
                    <div className="example-grid">
                        <div className="example-box">
                            <h4>Lakh (Words)</h4>
                            <p className="result">{formatIndianNumber(100000, true)}</p>
                            <code>formatIndianNumber(100000, true)</code>
                        </div>

                        <div className="example-box">
                            <h4>Crore (Words)</h4>
                            <p className="result">{formatIndianNumber(12500000, true)}</p>
                            <code>formatIndianNumber(12500000, true)</code>
                        </div>

                        <div className="example-box">
                            <h4>Thousand</h4>
                            <p className="result">{formatIndianNumber(5000, true)}</p>
                            <code>formatIndianNumber(5000, true)</code>
                        </div>
                    </div>
                </section>

                {/* Indian Terms */}
                <section className="showcase-section">
                    <h2>🇮🇳 Indian Terms</h2>
                    <div className="terms-grid">
                        <div className="term-box">
                            <span className="english">Journey</span>
                            <span className="hindi">{indianTerms.journey}</span>
                        </div>
                        <div className="term-box">
                            <span className="english">Travel</span>
                            <span className="hindi">{indianTerms.travel}</span>
                        </div>
                        <div className="term-box">
                            <span className="english">Traveler</span>
                            <span className="hindi">{indianTerms.traveler}</span>
                        </div>
                        <div className="term-box">
                            <span className="english">Destination</span>
                            <span className="hindi">{indianTerms.destination}</span>
                        </div>
                        <div className="term-box">
                            <span className="english">Eco</span>
                            <span className="hindi">{indianTerms.eco}</span>
                        </div>
                        <div className="term-box">
                            <span className="english">Nature</span>
                            <span className="hindi">{indianTerms.nature}</span>
                        </div>
                    </div>
                </section>

                {/* Calculations */}
                <section className="showcase-section">
                    <h2>🧮 Calculations</h2>
                    
                    <h3>GST Calculator (18%)</h3>
                    {(() => {
                        const gst = calculateGST(10000, 18);
                        return (
                            <div className="calculation-box">
                                <div className="calc-row">
                                    <span>Base Amount:</span>
                                    <span>{gst.formatted.base}</span>
                                </div>
                                <div className="calc-row">
                                    <span>GST (18%):</span>
                                    <span>{gst.formatted.gst}</span>
                                </div>
                                <div className="calc-row total">
                                    <span>Total:</span>
                                    <span>{gst.formatted.total}</span>
                                </div>
                            </div>
                        );
                    })()}

                    <h3>Discount Calculator (20% off)</h3>
                    {(() => {
                        const discount = calculateDiscount(10000, 20);
                        return (
                            <div className="calculation-box">
                                <div className="calc-row">
                                    <span>Original Price:</span>
                                    <span style={{textDecoration: 'line-through', color: 'var(--textMuted)'}}>
                                        {discount.formatted.original}
                                    </span>
                                </div>
                                <div className="calc-row">
                                    <span>Discount (20%):</span>
                                    <span style={{color: 'var(--success)'}}>
                                        -{discount.formatted.discount}
                                    </span>
                                </div>
                                <div className="calc-row total">
                                    <span>Final Price:</span>
                                    <span>{discount.formatted.final}</span>
                                </div>
                                <div className="savings-badge">
                                    You Save {discount.formatted.savings}!
                                </div>
                            </div>
                        );
                    })()}
                </section>

                {/* Misc Formatting */}
                <section className="showcase-section">
                    <h2>📊 Other Formatting</h2>
                    <div className="example-grid">
                        <div className="example-box">
                            <h4>Date</h4>
                            <p className="result">{formatIndianDate(new Date(), true)}</p>
                            <code>formatIndianDate(new Date(), true)</code>
                        </div>

                        <div className="example-box">
                            <h4>Distance</h4>
                            <p className="result">{formatDistance(2.5)}</p>
                            <code>formatDistance(2.5)</code>
                        </div>

                        <div className="example-box">
                            <h4>Duration</h4>
                            <p className="result">{formatDuration(145)}</p>
                            <code>formatDuration(145)</code>
                        </div>
                    </div>
                </section>

                {/* Typography */}
                <section className="showcase-section">
                    <h2>📝 Typography</h2>
                    <div className="typography-showcase">
                        <h1>Heading 1 - Display Text</h1>
                        <h2>Heading 2 - Page Title</h2>
                        <h3>Heading 3 - Section Title</h3>
                        <h4>Heading 4 - Subsection</h4>
                        <p>Regular paragraph text with proper line height and spacing for comfortable reading.</p>
                        <p className="small-text">Small text for captions and secondary information.</p>
                    </div>
                </section>

                {/* Footer */}
                <section className="showcase-section">
                    <div className="showcase-footer">
                        <h3>🎉 Design System Complete!</h3>
                        <p>All components are ready to use across the application.</p>
                        <p className="tagline">🇮🇳 Made with ❤️ for Safarnama</p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default DesignShowcase;
