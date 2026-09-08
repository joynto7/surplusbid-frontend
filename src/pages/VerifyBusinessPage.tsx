import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../lib/api';
import './VerifyBusinessPage.css';

const MAX_FILE_MB = 10;
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extLabel(name: string) {
  const ext = name.split('.').pop()?.toUpperCase() ?? 'FILE';
  return ext.slice(0, 4);
}

export default function VerifyBusinessPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [legalName, setLegalName] = useState(user?.companyName ?? '');
  const [taxId, setTaxId] = useState(user?.taxId ?? '');
  const [entityType, setEntityType] = useState('LLC');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('Ohio');
  const [phone, setPhone] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleFileChange(selected: File | null) {
    setFileError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setFileError('Unsupported file type. Upload a PDF, JPG or PNG.');
      setFile(null);
      return;
    }
    if (selected.size > MAX_FILE_MB * 1024 * 1024) {
      setFileError(`File is too large. Keep it under ${MAX_FILE_MB} MB.`);
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!file) {
      setFileError('Attach your registration certificate before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await api.updateProfile({ companyName: legalName, taxId });
      await api.submitVerification(file);
      await refreshUser();
      navigate('/verification-status');
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="verify-page">
      <div className="verify-topbar">
        <div className="auth-brand" style={{ fontSize: 15.5 }}>
          Surplus<span className="accent">Bid</span>
        </div>
        <div className="verify-steps">
          <span className="verify-step">
            <span className="badge done">✓</span>
            Account created
          </span>
          <span className="verify-step-sep" />
          <span className="verify-step current">
            <span className="badge active mono">2</span>
            Verify business
          </span>
          <span className="verify-step-sep" />
          <span className="verify-step">
            <span className="badge pending mono">3</span>
            Start bidding
          </span>
        </div>
        <a href="#" className="verify-save-later" onClick={(e) => { e.preventDefault(); navigate('/verification-status'); }}>
          Save and finish later
        </a>
      </div>

      <form className="verify-layout" onSubmit={handleSubmit}>
        <div style={{ minWidth: 0 }}>
          <h1>Verify your business</h1>
          <p>
            We check the legal name and tax ID against public registries, then match your bank record. This is what
            lets other verified businesses trust your bids.
          </p>

          <div className="verify-card">
            <div className="verify-card-title">Business details</div>
            <div className="verify-card-grid">
              <label>
                <span className="field-label">Legal company name</span>
                <input
                  className="field-input"
                  required
                  minLength={2}
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                />
                <span className="field-hint">Exactly as it appears on your registration certificate, including LLC or Inc.</span>
              </label>
              <div className="form-row-2">
                <label>
                  <span className="field-label">Tax ID (EIN)</span>
                  <input className="field-input mono" required value={taxId} onChange={(e) => setTaxId(e.target.value)} />
                </label>
                <label>
                  <span className="field-label">Entity type</span>
                  <select className="field-input" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
                    <option>LLC</option>
                    <option>C corporation</option>
                    <option>S corporation</option>
                    <option>Partnership</option>
                    <option>Sole proprietor</option>
                  </select>
                </label>
              </div>
              <label>
                <span className="field-label">Registered address</span>
                <input className="field-input" required value={address} onChange={(e) => setAddress(e.target.value)} />
              </label>
              <div className="form-row-2">
                <label>
                  <span className="field-label">State of registration</span>
                  <select className="field-input" value={region} onChange={(e) => setRegion(e.target.value)}>
                    <option>Ohio</option>
                    <option>Michigan</option>
                    <option>Indiana</option>
                    <option>Pennsylvania</option>
                  </select>
                </label>
                <label>
                  <span className="field-label">Phone</span>
                  <input className="field-input mono" required value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
              </div>
            </div>
          </div>

          <div className="verify-card">
            <div className="verify-card-title">Documents</div>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--dim)', margin: '6px 0 0' }}>
              PDF, JPG or PNG, up to {MAX_FILE_MB} MB. Photographs of paper documents are fine if all four corners are
              visible.
            </p>

            <div className="verify-dropzone">
              <div className="title">Drop your registration certificate here</div>
              <div className="or">or</div>
              <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                Choose a file
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                hidden
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
            </div>

            {file && !fileError && (
              <div className="verify-file-row">
                <span className="verify-file-icon">{extLabel(file.name)}</span>
                <span className="verify-file-meta">
                  <span className="name">{file.name}</span>
                  <span className="sub">{formatSize(file.size)} · ready to submit</span>
                </span>
                <span className="verify-file-pill">Attached</span>
                <button type="button" className="verify-file-remove" onClick={() => handleFileChange(null)}>
                  Remove
                </button>
              </div>
            )}

            {fileError && (
              <div className="verify-file-row error">
                <span className="verify-file-icon">{file ? extLabel(file.name) : 'ERR'}</span>
                <span className="verify-file-meta">
                  <span className="name">{file?.name ?? 'Upload failed'}</span>
                  <span className="sub error-text">{fileError}</span>
                </span>
                <button type="button" className="verify-file-remove" onClick={() => fileInputRef.current?.click()}>
                  Replace file
                </button>
              </div>
            )}
          </div>

          <div className="verify-actions">
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit for review'}
            </button>
            <button type="button" className="btn-secondary">
              Save draft
            </button>
            <span className="note">You can browse lots while the review runs.</span>
          </div>
          {submitError && <div className="form-banner-error">{submitError}</div>}
        </div>

        <aside className="verify-aside">
          <div className="verify-aside-card">
            <div className="heading">What reviewers check</div>
            <div className="verify-aside-checklist">
              <div className="item">
                <span className="marker done">✓</span>
                <span className="text">Legal name matches the certificate exactly</span>
              </div>
              <div className="item">
                <span className="marker done">✓</span>
                <span className="text">EIN found in the IRS registry</span>
              </div>
              <div className="item">
                <span className="marker warn">!</span>
                <span className="text">Documents are legible at full size</span>
              </div>
              <div className="item">
                <span className="marker todo">·</span>
                <span className="text">Bank account is in the company's name</span>
              </div>
            </div>
          </div>
          <div className="verify-aside-highlight">
            <div className="label">Typical review time</div>
            <div className="value">2–4 hours</div>
            <p>Submissions after 17:00 EDT are reviewed the next business morning.</p>
          </div>
          <div className="verify-aside-plain">
            <div className="label">Documents stay private</div>
            <p>Only platform reviewers see uploads. Sellers and buyers see your verified badge, never your paperwork.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
