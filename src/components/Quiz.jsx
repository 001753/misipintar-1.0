import { useState } from 'react'
import './Quiz.css'

const questions = [
  {
    q: 'Kamu punya Rp 100.000 di e-wallet. Apa yang sebaiknya kamu lakukan?',
    options: [
      'Langsung habiskan untuk beli skin game',
      'Sisihkan 20% untuk tabungan dulu',
      'Top-up lebih banyak biar bisa beli lebih banyak',
      'Transfer semua ke teman',
    ],
    correct: 1,
    explanation: 'Menyisihkan 20% untuk tabungan adalah kebiasaan finansial yang sehat. Aturan 20% ini membantu kamu memiliki dana darurat dan mencapai tujuan keuangan jangka panjang.',
  },
  {
    q: 'Apa perbedaan utama antara QRIS dan e-wallet?',
    options: [
      'QRIS adalah jenis e-wallet baru',
      'QRIS adalah standar kode QR untuk berbagai pembayaran, e-wallet adalah dompet digital',
      'E-wallet lebih aman dari QRIS',
      'Tidak ada bedanya, sama saja',
    ],
    correct: 1,
    explanation: 'QRIS (Quick Response Code Indonesian Standard) adalah standar nasional kode QR yang memungkinkan satu kode QR diterima berbagai platform pembayaran. E-wallet adalah aplikasi penyimpanan uang digital seperti GoPay, OVO, dll.',
  },
  {
    q: 'Kamu mau beli game dengan harga Rp 50.000 tapi uang sakumu habis. Apa yang terbaik?',
    options: [
      'Minta ke orang tua dan berjanji akan bayar',
      'Pinjam ke teman',
      'Tunggu sampai punya uang sendiri dari tabungan',
      'Cari cara untuk mendapat uang lebih cepat tanpa kerja',
    ],
    correct: 2,
    explanation: 'Menunggu sampai kamu punya uang sendiri mengajarkan nilai kesabaran dan penundaan kepuasan (delayed gratification) — salah satu kunci sukses finansial jangka panjang.',
  },
  {
    q: 'Mengapa uang digital terasa "tidak nyata" dibanding uang tunai?',
    options: [
      'Karena uang digital tidak ada nilainya',
      'Karena tidak ada sensasi fisik saat mengeluarkan uang digital',
      'Karena uang digital bisa dibuat sendiri',
      'Karena bank yang menyimpannya',
    ],
    correct: 1,
    explanation: 'Penelitian psikologi menunjukkan bahwa membayar dengan uang tunai terasa lebih "menyakitkan" karena ada sensasi fisik kehilangan. Uang digital mengurangi rasa ini, sehingga kita lebih mudah menghabiskannya.',
  },
  {
    q: 'Apa yang dimaksud dengan "inflasi" dan bagaimana dampaknya pada tabunganmu?',
    options: [
      'Harga barang naik, jadi nilai uang berkurang dari waktu ke waktu',
      'Harga barang turun, jadi uang jadi lebih berharga',
      'Jumlah uang yang beredar menurun',
      'Bunga bank yang tinggi',
    ],
    correct: 0,
    explanation: 'Inflasi adalah kenaikan harga barang secara umum. Jika tabunganmu tidak tumbuh melebihi inflasi, daya beli uangmu berkurang. Ini sebabnya investasi penting untuk mengalahkan inflasi.',
  },
]

export default function Quiz() {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState([])
  const [finished, setFinished] = useState(false)

  const q = questions[current]

  function handleSelect(idx) {
    if (selected !== null) return
    setSelected(idx)
    setShowResult(true)
    if (idx === q.correct) setScore(s => s + 1)
    setAnswers(a => [...a, idx])
  }

  function handleNext() {
    if (current + 1 < questions.length) {
      setCurrent(c => c + 1)
      setSelected(null)
      setShowResult(false)
    } else {
      setFinished(true)
    }
  }

  function handleRestart() {
    setCurrent(0)
    setSelected(null)
    setShowResult(false)
    setScore(0)
    setAnswers([])
    setFinished(false)
  }

  const percent = Math.round((score / questions.length) * 100)

  return (
    <section id="quiz" className="quiz section">
      <div className="container">
        <div className="section-header">
          <span className="badge">🧪 Uji Pengetahuan</span>
          <h2 className="section-title">Kuis <span className="gradient-text">Literasi Keuangan</span></h2>
          <p className="section-desc">Seberapa paham kamu tentang keuangan digital? Coba kuis singkat ini!</p>
        </div>

        <div className="quiz-card">
          {!finished ? (
            <>
              <div className="quiz-progress">
                <div className="progress-text">Soal {current + 1} dari {questions.length}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${((current + 1) / questions.length) * 100}%` }}></div>
                </div>
              </div>
              <div className="quiz-question">{q.q}</div>
              <div className="quiz-options">
                {q.options.map((opt, i) => (
                  <button
                    key={i}
                    className={`quiz-option ${selected !== null ? (i === q.correct ? 'correct' : i === selected ? 'wrong' : 'dim') : ''}`}
                    onClick={() => handleSelect(i)}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
              {showResult && (
                <div className={`quiz-feedback ${selected === q.correct ? 'feedback-correct' : 'feedback-wrong'}`}>
                  <div className="feedback-icon">{selected === q.correct ? '✅' : '❌'}</div>
                  <div>
                    <div className="feedback-title">{selected === q.correct ? 'Benar!' : 'Belum tepat!'}</div>
                    <div className="feedback-text">{q.explanation}</div>
                  </div>
                </div>
              )}
              {showResult && (
                <button className="btn-primary quiz-next" onClick={handleNext}>
                  {current + 1 < questions.length ? 'Soal Berikutnya →' : 'Lihat Hasil 🎉'}
                </button>
              )}
            </>
          ) : (
            <div className="quiz-result">
              <div className="result-emoji">
                {percent >= 80 ? '🏆' : percent >= 60 ? '👏' : '📚'}
              </div>
              <h3 className="result-title">
                {percent >= 80 ? 'Luar Biasa!' : percent >= 60 ? 'Bagus!' : 'Terus Belajar!'}
              </h3>
              <div className="result-score">
                <span className="score-num">{score}</span>
                <span className="score-total">/{questions.length}</span>
              </div>
              <div className="result-percent">{percent}% benar</div>
              <p className="result-message">
                {percent >= 80
                  ? 'Kamu sudah punya pemahaman keuangan digital yang sangat baik! Terus pertahankan kebiasaan finansial yang sehat.'
                  : percent >= 60
                  ? 'Pemahaman keuanganmu sudah lumayan. Pelajari modul-modul di atas untuk meningkatkan literasi finansialmu!'
                  : 'Jangan menyerah! Literasi keuangan adalah investasi terbaik untuk masa depanmu. Baca modul-modul kami dan coba lagi!'}
              </p>
              <button className="btn-primary" onClick={handleRestart}>Coba Lagi 🔄</button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
