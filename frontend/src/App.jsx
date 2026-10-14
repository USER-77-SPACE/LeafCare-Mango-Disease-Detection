
import { useState } from 'react'
import './App.css'

const API_URL = 'http://127.0.0.1:8000'

const diseaseInfo = {
  Anthracnose: {
    icon: '🍂',
    description:
      'Anthracnose is a fungal disease that can cause dark spots and lesions on mango leaves.',
    advice:
      'Remove heavily affected plant material where appropriate, avoid prolonged leaf wetness, and consult a local agricultural expert about suitable treatment.',
  },
  Bacterial_Canker: {
    icon: '🦠',
    description:
      'Bacterial canker can cause dark lesions and damage to mango leaves and other plant parts.',
    advice:
      'Avoid handling wet plants, disinfect pruning tools, and seek agricultural advice to confirm the cause and appropriate management.',
  },
  Cutting_Weevil: {
    icon: '🐛',
    description:
      'Cutting weevil damage may appear as cut or damaged leaf tissue.',
    advice:
      'Inspect leaves and shoots for insect activity and ask a local agricultural expert about suitable pest management.',
  },
  Die_Back: {
    icon: '🥀',
    description:
      'Die back is associated with drying or dying shoots and branches and may affect plant health.',
    advice:
      'Inspect affected branches and environmental conditions. Have the cause confirmed before applying treatment.',
  },
  Gall_Midge: {
    icon: '🍃',
    description:
      'Gall midge damage can cause abnormal leaf development, curling, or other visible changes.',
    advice:
      'Inspect new leaves for signs of insects and damage, and consult an agricultural expert for control options.',
  },
  Healthy: {
    icon: '🌿',
    description:
      'The model classified this image as belonging to the healthy mango leaf category.',
    advice:
      'Continue regular plant care, monitor new growth, and inspect leaves periodically for changes.',
  },
  Powdery_Mildew: {
    icon: '🌫️',
    description:
      'Powdery mildew is a fungal disease that can produce a white, powder-like coating on plant surfaces.',
    advice:
      'Check for powdery growth and consult an agricultural expert about appropriate disease management.',
  },
  Sooty_Mould: {
    icon: '⚫',
    description:
      'Sooty mould appears as a dark coating on plant surfaces and can be associated with honeydew-producing insects.',
    advice:
      'Inspect the plant for insects such as scale insects or aphids and seek advice on managing the underlying cause.',
  },
}

function App() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please choose a JPG, PNG, or WEBP image.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('The image must be smaller than 10 MB.')
      return
    }

    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError('')
  }

  async function handlePredict() {
    if (!image) {
      setError('Please upload a mango leaf image first.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', image)

      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Image analysis failed.')
      }

      setResult({
        prediction: data.prediction,
        confidence: data.confidence,
        message: data.message,
      })
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the backend. Make sure FastAPI is running at http://127.0.0.1:8000.'
          : err.message || 'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  function resetAnalysis() {
    setImage(null)
    setPreview('')
    setResult(null)
    setError('')
  }

  const info = result
    ? diseaseInfo[result.prediction] || {
        icon: '🌱',
        description: 'The model has returned a prediction for this image.',
        advice:
          'Compare the result with visible symptoms and consult an agricultural expert before treatment.',
      }
    : null

  return (
    <div className="app">
      <nav className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">🌿</span>
          LeafCare
        </a>

        <div className="nav-right">
          <span className="nav-status">
            <span className="status-dot" />
            SVM Model
          </span>
          <a className="nav-link" href="#how-it-works">
            How it works
          </a>
        </div>
      </nav>

      <main id="home">
        <section className="hero">
          <div className="eyebrow">
            <span>✦</span> SMART AGRICULTURE · MACHINE LEARNING
          </div>

          <h1>
            A healthier leaf.
            <br />
            <span>A better harvest.</span>
          </h1>

          <p className="hero-description">
            Upload a mango leaf photo and let our machine learning model
            identify which of eight leaf categories it most closely matches.
          </p>

          <div className="hero-points">
            <span>✓ Image-based analysis</span>
            <span>✓ 8 leaf categories</span>
            <span>✓ Instant prediction</span>
          </div>
        </section>

        <section className="workspace">
          <div className="panel upload-panel">
            <div className="panel-heading">
              <span className="step-number">01</span>
              <div>
                <h2>Upload your leaf</h2>
                <p>Choose a clear image of a mango leaf.</p>
              </div>
            </div>

            <label className={`upload-area ${preview ? 'has-image' : ''}`}>
              {preview ? (
                <img
                  className="preview-image"
                  src={preview}
                  alt="Preview of uploaded mango leaf"
                />
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">↑</div>
                  <strong>Drop your leaf image here</strong>
                  <span>or click to browse your computer</span>
                  <span className="file-types">JPG · PNG · WEBP</span>
                </div>
              )}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />
            </label>

            {image && (
              <div className="file-details">
                <span className="file-check">✓</span>
                <div className="file-text">
                  <strong>{image.name}</strong>
                  <span>{(image.size / 1024).toFixed(1)} KB</span>
                </div>
                <button
                  className="remove-button"
                  onClick={resetAnalysis}
                  type="button"
                  aria-label="Remove selected image"
                >
                  ×
                </button>
              </div>
            )}

            <button
              className="analyze-button"
              onClick={handlePredict}
              disabled={loading || !image}
              type="button"
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Analyzing leaf...
                </>
              ) : (
                <>
                  Analyze leaf <span className="button-arrow">→</span>
                </>
              )}
            </button>

            {error && (
              <div className="error-message" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            <p className="upload-footnote">
              🔒 Your selected image is sent to your local backend for
              prediction.
            </p>
          </div>

          <div className="panel results-panel" aria-live="polite">
            <div className="panel-heading">
              <span className="step-number">02</span>
              <div>
                <h2>Analysis results</h2>
                <p>Results from your trained SVM classifier.</p>
              </div>
            </div>

            {loading ? (
              <div className="waiting-state">
                <div className="loading-leaf">🌿</div>
                <h3>Examining your leaf</h3>
                <p>
                  Extracting image features and running the machine learning
                  prediction.
                </p>
                <div className="loading-track">
                  <span />
                </div>
              </div>
            ) : result ? (
              <div className="result-content">
                <div className="result-icon">{info.icon}</div>

                <span className="result-label">PREDICTED CATEGORY</span>
                <h3 className="result-title">
                  {result.prediction.replaceAll('_', ' ')}
                </h3>

                <div className="confidence-card">
                  <div className="confidence-top">
                    <span>Model confidence</span>
                    <strong>{result.confidence}%</strong>
                  </div>
                  <div
                    className="confidence-track"
                    role="progressbar"
                    aria-valuenow={result.confidence}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Model confidence"
                  >
                    <span style={{ width: `${result.confidence}%` }} />
                  </div>
                  <p>
                    This score is the model's estimated confidence, not a
                    guarantee that the prediction is correct.
                  </p>
                </div>

                <div className="info-section">
                  <h4>About this category</h4>
                  <p>{info.description}</p>
                </div>

                <div className="advice-card">
                  <span className="advice-icon">🌱</span>
                  <div>
                    <h4>Suggested next step</h4>
                    <p>{info.advice}</p>
                  </div>
                </div>

                <p className="api-message">{result.message}</p>

                <button
                  className="secondary-button"
                  onClick={resetAnalysis}
                  type="button"
                >
                  Analyze another image ↗
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-illustration">
                  <span className="illustration-circle">🌿</span>
                  <span className="sparkle sparkle-one">✦</span>
                  <span className="sparkle sparkle-two">✧</span>
                </div>

                <h3>Your results will appear here</h3>
                <p>
                  Upload a mango leaf image and select Analyze leaf to get a
                  prediction from your trained model.
                </p>

                <div className="result-feature">
                  <span>✦</span>
                  <div>
                    <strong>Disease category</strong>
                    <small>One of eight trained classes</small>
                  </div>
                </div>

                <div className="result-feature">
                  <span>✦</span>
                  <div>
                    <strong>Model confidence</strong>
                    <small>An estimated prediction score</small>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="section-intro">
            <span className="eyebrow">BEHIND THE ANALYSIS</span>
            <h2>How LeafCare works</h2>
            <p>A simple computer vision and machine learning pipeline.</p>
          </div>

          <div className="how-grid">
            <article className="how-card">
              <div className="how-icon">📷</div>
              <span className="how-number">STEP 01</span>
              <h3>Upload image</h3>
              <p>
                Select a clear photo of a mango leaf from your device.
              </p>
            </article>

            <article className="how-card">
              <div className="how-icon">🔬</div>
              <span className="how-number">STEP 02</span>
              <h3>Extract features</h3>
              <p>
                The backend calculates color statistics and a grayscale
                histogram.
              </p>
            </article>

            <article className="how-card">
              <div className="how-icon">🧠</div>
              <span className="how-number">STEP 03</span>
              <h3>SVM prediction</h3>
              <p>
                The trained Support Vector Machine predicts one of eight
                categories.
              </p>
            </article>
          </div>
        </section>

        <section className="classes-section">
          <div>
            <span className="eyebrow">TRAINED CATEGORIES</span>
            <h2>Eight classes. One helpful tool.</h2>
            <p>
              These are the categories included in the current training
              dataset.
            </p>
          </div>

          <div className="class-list">
            {Object.entries(diseaseInfo).map(([name, item]) => (
              <div className="class-chip" key={name}>
                <span>{item.icon}</span>
                {name.replaceAll('_', ' ')}
              </div>
            ))}
          </div>
        </section>

        <div className="disclaimer">
          <strong>Important:</strong> LeafCare is an educational prototype.
          Image predictions can be wrong and are not a confirmed diagnosis.
          Confirm symptoms with a qualified agricultural expert before
          choosing a treatment.
        </div>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#home">
          <span className="brand-icon">🌿</span>
          LeafCare
        </a>
        <span>Mango Leaf Disease Detection · ML College Project</span>
      </footer>
    </div>
  )
}

export default App
