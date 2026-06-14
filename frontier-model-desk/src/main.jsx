import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import vendors from './data/vendors.json';
import './styles.css';

const labels = {
  reasoning: 'Reasoning quality',
  distribution: 'Distribution',
  enterprise: 'Enterprise traction',
  economics: 'Developer economics',
  governance: 'Governance'
};

const defaultWeights = {
  reasoning: 30,
  distribution: 25,
  enterprise: 25,
  economics: 10,
  governance: 10
};

function normalizeWeights(weights) {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;

  return {
    reasoning: weights.reasoning / total,
    distribution: weights.distribution / total,
    enterprise: weights.enterprise / total,
    economics: weights.economics / total,
    governance: weights.governance / total
  };
}

function scoreVendor(vendor, weights) {
  const w = normalizeWeights(weights);

  return Math.round(
    vendor.scores.reasoning * w.reasoning +
      vendor.scores.distribution * w.distribution +
      vendor.scores.enterprise * w.enterprise +
      vendor.scores.economics * w.economics +
      vendor.scores.governance * w.governance
  );
}

function rankVendors(weights) {
  return vendors
    .map((vendor) => ({
      ...vendor,
      weightedScore: scoreVendor(vendor, weights)
    }))
    .sort((a, b) => b.weightedScore - a.weightedScore);
}

function buildMemo(winner, weights) {
  const normalized = normalizeWeights(weights);
  const keyWeights = Object.entries(normalized)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([key]) => labels[key])
    .join(' + ');

  return `При текущих весах лидер — ${winner.name}. Причина: ${winner.summary} Главные факторы сценария — ${keyWeights}. Главный риск: ${winner.risk}`;
}

function App() {
  const [weights, setWeights] = useState(defaultWeights);
  const ranked = useMemo(() => rankVendors(weights), [weights]);
  const winner = ranked[0];

  const exportMemo = () => {
    const memo = buildMemo(winner, weights);
    const blob = new Blob([memo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'frontier-model-memo.txt';
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <main className="app">
      <header className="hero">
        <div>
          <div className="eyebrow">Frontier Model Desk</div>
          <h1>Сравнение лидеров reasoning-моделей</h1>
          <p>
            Инструмент для проверки тезиса: кто выигрывает при разных весах модели,
            дистрибуции, корпоративной тяги, экономики и governance.
          </p>
        </div>
      </header>

      <section className="grid">
        <section className="panel">
          <div className="section-kicker">Сценарий</div>
          <h2>Веса факторов</h2>
          <p className="muted">Меняйте веса и смотрите, как меняется лидер.</p>

          <div className="sliders">
            {Object.keys(weights).map((key) => (
              <label className="slider-row" key={key}>
                <span>
                  {labels[key]} <b>{weights[key]}</b>
                </span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={weights[key]}
                  onChange={(event) =>
                    setWeights({ ...weights, [key]: Number(event.target.value) })
                  }
                />
              </label>
            ))}
          </div>
        </section>

        <section className="panel chart-panel">
          <div className="section-kicker">Ranking</div>
          <h2>Текущий рейтинг</h2>

          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={ranked} layout="vertical" margin={{ left: 24, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="weightedScore" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="panel winner">
          <div className="section-kicker">Leader</div>
          <h2>{winner.name}</h2>
          <div className="score">{winner.weightedScore}/100</div>
          <p>{winner.summary}</p>

          <h3>Почему лидер</h3>
          <ul>
            {winner.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h3>Главный риск</h3>
          <p className="muted">{winner.risk}</p>

          <button onClick={exportMemo}>Export memo</button>
        </section>
      </section>

      <section className="panel table-panel">
        <div className="section-kicker">Source data</div>
        <h2>Базовые оценки</h2>

        <table>
          <thead>
            <tr>
              <th>Компания</th>
              <th>Модели</th>
              <th>Reasoning</th>
              <th>Distribution</th>
              <th>Enterprise</th>
              <th>Economics</th>
              <th>Governance</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id}>
                <td>{vendor.name}</td>
                <td>{vendor.models}</td>
                <td>{vendor.scores.reasoning}</td>
                <td>{vendor.scores.distribution}</td>
                <td>{vendor.scores.enterprise}</td>
                <td>{vendor.scores.economics}</td>
                <td>{vendor.scores.governance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);