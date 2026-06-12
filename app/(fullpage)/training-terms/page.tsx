import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — TIBLOGICS AI Practical Training",
  description: "Terms and Conditions for the TIBLOGICS AI Practical Training — June Cohort.",
};

const syne = "'Syne', sans-serif";
const dm = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";

export default function TrainingTermsPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0F1617; color: #E8EDEE; }
        .terms-wrap { max-width: 780px; margin: 0 auto; padding: 60px 24px 100px; font-family: ${dm}; line-height: 1.75; }
        .logo-row { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
        .logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg,#F47C4C,#F9A738); border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .logo-name { font-family: ${syne}; font-weight: 700; font-size: 15px; color: #fff; letter-spacing: .04em; }
        .logo-sub { font-size: 10px; color: rgba(255,255,255,.4); letter-spacing: .08em; }
        h1 { font-family: ${syne}; font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 6px; }
        .sub { font-size: .82rem; color: rgba(255,255,255,.35); margin-bottom: 8px; font-style: italic; }
        .meta { font-size: .82rem; color: rgba(255,255,255,.4); margin-bottom: 40px; line-height: 1.8; }
        .meta a { color: #F47C4C; text-decoration: none; }
        .divider { height: 1px; background: rgba(255,255,255,.08); margin: 36px 0; }
        .intro { font-size: .95rem; color: rgba(255,255,255,.65); margin-bottom: 8px; }
        .section { background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; padding: 24px 28px; margin-bottom: 12px; }
        .section-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .section-num { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: rgba(244,124,76,.15); border: 1px solid rgba(244,124,76,.3); border-radius: 8px; font-family: ${syne}; font-size: .78rem; font-weight: 700; color: #F47C4C; flex-shrink: 0; }
        .section-title { font-family: ${syne}; font-size: .95rem; font-weight: 700; color: #fff; }
        p { font-size: .9rem; color: rgba(255,255,255,.65); margin-bottom: 10px; }
        p:last-child { margin-bottom: 0; }
        ul, ol { padding-left: 20px; margin-bottom: 12px; }
        li { font-size: .9rem; color: rgba(255,255,255,.65); margin-bottom: 5px; }
        strong { color: #E8EDEE; }
        a { color: #F47C4C; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .refund-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: .85rem; }
        .refund-table th { background: rgba(244,124,76,.1); color: #F47C4C; font-family: ${syne}; font-size: .78rem; letter-spacing: .06em; text-transform: uppercase; padding: 10px 14px; text-align: left; border-bottom: 1px solid rgba(244,124,76,.2); }
        .refund-table td { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,.05); color: rgba(255,255,255,.65); vertical-align: top; }
        .refund-table tr:last-child td { border-bottom: none; }
        .badge-yes { color: #6EE7B7; }
        .badge-warn { color: #FCD34D; }
        .badge-no { color: #F87171; }
        .acceptance-box { background: rgba(244,124,76,.06); border: 1px solid rgba(244,124,76,.2); border-radius: 14px; padding: 24px 28px; margin-top: 36px; }
        .acceptance-title { font-family: ${syne}; font-size: .78rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: #F47C4C; margin-bottom: 14px; }
        .check-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; font-size: .88rem; color: rgba(255,255,255,.65); }
        .check-row::before { content: "\\2610"; color: #F47C4C; font-size: 1rem; flex-shrink: 0; margin-top: 1px; }
        .footer { text-align: center; margin-top: 48px; font-size: .8rem; color: rgba(255,255,255,.25); line-height: 1.8; }
        .footer a { color: rgba(255,255,255,.35); }
      `}</style>

      <div className="terms-wrap">
        <div className="logo-row">
          <div className="logo-icon">
            <svg viewBox="0 0 38 38" fill="none" width="22" height="22">
              <circle cx="8" cy="19" r="4.5" fill="rgba(255,255,255,0.85)"/>
              <circle cx="19" cy="7" r="3.5" fill="rgba(255,255,255,0.65)"/>
              <circle cx="30" cy="19" r="4.5" fill="rgba(255,255,255,0.85)"/>
              <circle cx="19" cy="31" r="3.5" fill="rgba(255,255,255,0.65)"/>
              <circle cx="19" cy="19" r="6" fill="white"/>
            </svg>
          </div>
          <div>
            <div className="logo-name">ARFA &nbsp;<span style={{color:"rgba(255,255,255,0.35)",fontWeight:400}}>|</span>&nbsp; TIBLOGICS</div>
            <div className="logo-sub">AI Implementation &amp; Digital Solutions</div>
          </div>
        </div>

        <h1>Terms &amp; Conditions</h1>
        <p className="sub">AI Practical Training — June Cohort</p>

        <div className="meta">
          <strong>Effective Date:</strong> June 1, 2026<br/>
          <strong>Last Updated:</strong> June 1, 2026<br/>
          <strong>Issued by:</strong> TIBLOGICS · Maryland, USA<br/>
          <strong>Contact:</strong>{" "}
          <a href="mailto:arfa_edu@tiblogics.com">arfa_edu@tiblogics.com</a>{" "}·{" "}
          <a href="https://www.tiblogics.com" target="_blank" rel="noopener">www.tiblogics.com</a>
        </div>

        <div className="divider"/>

        <p className="intro">
          By completing your registration and submitting payment for the TIBLOGICS AI Practical Training,
          you agree to be bound by the following Terms and Conditions. Please read them carefully before proceeding.
        </p>

        <div className="divider"/>

        <div className="section">
          <div className="section-head"><span className="section-num">1</span><span className="section-title">Program Overview</span></div>
          <p>The TIBLOGICS AI Practical Training is a live, cohort-based online training program consisting of <strong>4 live sessions over 4 consecutive weekends</strong>, delivered via Zoom, with an additional bonus graduation/certificate session scheduled at a date to be announced after Session 4.</p>
          <ul>
            <li><strong>Session dates:</strong> June 27, July 4, July 11, and July 18, 2026</li>
            <li><strong>Time:</strong> 9:30 AM – 1:00 PM (includes breaks)</li>
            <li><strong>Format:</strong> Live on Zoom</li>
            <li><strong>Graduation session:</strong> Date TBA</li>
          </ul>
          <p>TIBLOGICS reserves the right to adjust session dates, times, or format with reasonable advance notice to registered participants.</p>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">2</span><span className="section-title">Payment &amp; Registration</span></div>
          <p><strong>2.1</strong> The full program fee for the June Cohort is <strong>$649 USD</strong> (Founding Cohort pricing). This is a one-time, all-inclusive payment.</p>
          <p><strong>2.2</strong> Registration is confirmed only upon receipt of full payment. Partial payments do not constitute a confirmed spot.</p>
          <p><strong>2.3</strong> Spots are limited and allocated strictly on a first-come, first-served basis. Payment secures your seat.</p>
          <p><strong>2.4</strong> All prices are listed in US Dollars (USD). Participants are responsible for any currency conversion fees or bank charges imposed by their financial institution.</p>
          <p><strong>2.5</strong> TIBLOGICS reserves the right to adjust pricing for future cohorts. June Cohort pricing is locked for registered June Cohort participants only.</p>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">3</span><span className="section-title">What Is Included</span></div>
          <p>Your $649 registration includes:</p>
          <ul>
            <li>4 live Zoom sessions (approximately 3 hours each, Saturdays 9:30 AM – 1:00 PM)</li>
            <li>All session handouts and lab worksheets</li>
            <li>TIBLOGICS AI Prompt Library (100+ prompts)</li>
            <li>Your personal AI identity blueprint template</li>
            <li>Intro to vibe coding — hands-on lab in Session 4</li>
            <li>Session recordings (lifetime access)</li>
            <li>Cohort WhatsApp community access</li>
            <li>Mid-week check-ins and tips</li>
            <li>30-day post-training support via email or WhatsApp</li>
            <li>One individually numbered TIBLOGICS Certificate of Completion</li>
            <li>Bonus graduation ceremony session (date TBA)</li>
          </ul>
          <p>Any additional products, services, or community memberships are separate and not included in this registration fee.</p>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">4</span><span className="section-title">Refund Policy</span></div>

          <table className="refund-table">
            <thead>
              <tr><th>Cancellation Timing</th><th>Refund</th></tr>
            </thead>
            <tbody>
              <tr><td>5+ days before Session 1 (by June 22, 2026)</td><td><span className="badge-yes">Full refund — $649</span></td></tr>
              <tr><td>3–4 days before Session 1 (June 23–24, 2026)</td><td><span className="badge-warn">50% refund — $324.50</span></td></tr>
              <tr><td>Less than 48 hrs before or after Session 1 begins</td><td><span className="badge-no">No refund</span></td></tr>
              <tr><td>No-show without prior written notice</td><td><span className="badge-no">No refund</span></td></tr>
              <tr><td>TIBLOGICS cancels the program</td><td><span className="badge-yes">Full refund within 10 business days</span></td></tr>
            </tbody>
          </table>

          <p><strong>4.1 Full Refund:</strong> Submit a written cancellation to <a href="mailto:arfa_edu@tiblogics.com">arfa_edu@tiblogics.com</a> at least 5 days before Session 1 (by June 22, 2026).</p>
          <p><strong>4.2 Partial Refund:</strong> Cancellations 3–4 days before Session 1 (June 23–24, 2026) are eligible for a 50% refund. Administrative costs are non-refundable.</p>
          <p><strong>4.3 No Refund:</strong> No refunds for requests received less than 48 hours before Session 1 or after Session 1 has begun.</p>
          <p><strong>4.4 No-Show Policy:</strong> Participants who do not attend without prior written notice are not entitled to a refund. Session recordings will still be accessible.</p>
          <p><strong>4.5 Registration Transfer:</strong> Registration may be transferred to another individual at no charge with written notice at least 5 days before Session 1. Late transfers are at TIBLOGICS&apos; discretion.</p>
          <p><strong>4.6 Program Cancellation by TIBLOGICS:</strong> If TIBLOGICS cancels before the Training begins, all participants receive a full refund within 10 business days. Mid-program cancellations due to force majeure may result in a prorated refund for sessions not delivered.</p>
          <p><strong>4.7 Rescheduling:</strong> If TIBLOGICS reschedules a session due to technical issues or force majeure, no refund is issued. The session will be rescheduled within 14 days.</p>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">5</span><span className="section-title">Participant Responsibilities</span></div>
          <p><strong>5.1</strong> Participants are responsible for a stable internet connection, a functioning laptop or tablet, and a working Zoom installation prior to Session 1.</p>
          <p><strong>5.2</strong> Participants are responsible for creating required accounts (Claude or ChatGPT, Canva, Google account) before the training. Account costs are not included in the registration fee.</p>
          <p><strong>5.3</strong> Participants agree to engage respectfully at all times. TIBLOGICS reserves the right to remove disruptive participants without refund.</p>
          <p><strong>5.4</strong> Participants must be at least 18 years of age. Individuals under 18 may participate only with written parental or guardian consent.</p>
          <p><strong>5.5</strong> The Zoom meeting link is private and confidential. Sharing it with unregistered individuals is strictly prohibited and may result in immediate removal without refund.</p>
          <p><strong>5.6</strong> By registering, participants consent to receive training-related communications via email and WhatsApp. Opting out of session links does not entitle the participant to a refund.</p>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">6</span><span className="section-title">Code of Conduct &amp; Community Standards</span></div>
          <p><strong>6.1</strong> Participants agree not to engage in harassment, discrimination, hate speech, or bullying during sessions, in the WhatsApp group, or in any TIBLOGICS community space. Violations result in immediate removal without refund.</p>
          <p><strong>6.2</strong> Participants may not share or distribute screenshots, recordings, or materials from training sessions without prior written permission from TIBLOGICS.</p>
          <p><strong>6.3</strong> Participants agree not to make false or defamatory statements about TIBLOGICS in any public forum. Legitimate feedback may be submitted directly to <a href="mailto:arfa_edu@tiblogics.com">arfa_edu@tiblogics.com</a>.</p>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">7</span><span className="section-title">Intellectual Property</span></div>
          <p><strong>7.1</strong> All training content, materials, handouts, prompt libraries, frameworks, and recordings are the exclusive intellectual property of TIBLOGICS.</p>
          <p><strong>7.2</strong> Participants receive a personal, non-exclusive, non-transferable license to use provided materials for their own personal and professional development.</p>
          <p><strong>7.3</strong> Participants may not reproduce, distribute, resell, or create derivative works from TIBLOGICS materials without prior written consent.</p>
          <p><strong>7.4</strong> Recording of live sessions by participants is strictly prohibited without written permission.</p>
          <p><strong>7.5</strong> The TIBLOGICS name, logo, branding, and curriculum are protected trademarks. Unauthorized use is prohibited.</p>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">8</span><span className="section-title">Recordings &amp; Privacy</span></div>
          <p><strong>8.1</strong> TIBLOGICS may record live sessions for participant access and internal quality assurance.</p>
          <p><strong>8.2</strong> By registering, participants consent to being present in session recordings in the context of the group Zoom call. Individual footage will not be published publicly without separate written consent.</p>
          <p><strong>8.3</strong> Testimonial recording during the graduation ceremony is entirely voluntary. By providing a testimonial, participants grant TIBLOGICS permission to use it for marketing purposes.</p>
          <p><strong>8.4</strong> Participant data (name, email, WhatsApp) collected during registration will be used solely for training administration and communication. TIBLOGICS will not sell or share participant data with third parties.</p>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">9</span><span className="section-title">Limitation of Liability</span></div>
          <p><strong>9.1</strong> TIBLOGICS provides training for educational purposes only. Results vary based on individual effort and application. No guarantee of specific financial, business, or career outcomes is made.</p>
          <p><strong>9.2</strong> TIBLOGICS is not responsible for technical difficulties caused by participant equipment, internet connection, or third-party platforms.</p>
          <p><strong>9.3</strong> TIBLOGICS&apos; total liability to any participant shall not exceed the amount paid for the Training ($649).</p>
          <p><strong>9.4</strong> TIBLOGICS shall not be liable for indirect, incidental, special, consequential, or punitive damages.</p>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">10</span><span className="section-title">Third-Party Tools &amp; AI Disclaimer</span></div>
          <p>The Training uses third-party platforms including Zoom, Claude (Anthropic), ChatGPT (OpenAI), Canva, and Google Workspace. TIBLOGICS is not affiliated with or responsible for these platforms. Any subscription costs are the participant&apos;s responsibility.</p>
          <p><strong>AI Disclaimer:</strong> AI tools used during the Training may produce inaccurate, incomplete, or outdated information. TIBLOGICS does not guarantee the accuracy of AI-generated outputs. Participants are responsible for exercising independent judgment when applying AI tools professionally.</p>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">11</span><span className="section-title">Certificate of Completion</span></div>
          <p>The TIBLOGICS Certificate of Completion is awarded to participants who attend at least 3 of the 4 core sessions. Participants who miss more than one session due to circumstances within their control are not guaranteed a certificate. Exceptions for documented emergencies are at TIBLOGICS&apos; discretion.</p>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">12</span><span className="section-title">Governing Law &amp; Disputes</span></div>
          <p>These Terms are governed by the laws of the State of Maryland, United States of America. Disputes shall first be resolved through good-faith negotiation. If unresolved, disputes shall be submitted to binding arbitration in Maryland in accordance with applicable arbitration rules.</p>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">13</span><span className="section-title">Amendments</span></div>
          <p>TIBLOGICS reserves the right to update these Terms at any time. Participants will be notified of material changes via email. Continued participation after notification constitutes acceptance of updated terms.</p>
        </div>

        <div className="section">
          <div className="section-head"><span className="section-num">14</span><span className="section-title">Entire Agreement</span></div>
          <p>These Terms and Conditions, together with the registration confirmation email, constitute the entire agreement between the participant and TIBLOGICS with respect to the AI Practical Training — June Cohort. They supersede all prior communications, representations, or agreements.</p>
        </div>

        <div className="acceptance-box">
          <div className="acceptance-title">Acceptance</div>
          <p style={{marginBottom:"16px",fontSize:".88rem"}}>By submitting payment, you confirm that:</p>
          <div className="check-row">You have read and understood these Terms and Conditions in full</div>
          <div className="check-row">You agree to be bound by these Terms and Conditions</div>
          <div className="check-row">You are at least 18 years of age or have parental/guardian consent</div>
          <div className="check-row">The information you provided during registration is accurate</div>
        </div>

        <div className="footer">
          TIBLOGICS · Maryland, USA<br/>
          <a href="mailto:arfa_edu@tiblogics.com">arfa_edu@tiblogics.com</a> &nbsp;·&nbsp;
          <a href="https://www.tiblogics.com" target="_blank" rel="noopener">www.tiblogics.com</a><br/>
          2026 TIBLOGICS. All rights reserved.
        </div>
      </div>
    </>
  );
}
