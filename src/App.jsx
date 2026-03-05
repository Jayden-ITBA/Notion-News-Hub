import { useState, useEffect } from 'react'
import './App.css'

function App() {
    const [config, setConfig] = useState({
        sources: [],
        keywords: [],
        interval: { value: 1, unit: 'Hours' }
    });
    const [newSource, setNewSource] = useState({ name: '', url: '' });
    const [newKeyword, setNewKeyword] = useState('');
    const [adminPin, setAdminPin] = useState('');
    const [status, setStatus] = useState('Idle');

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => setConfig(data))
            .catch(err => console.error('Failed to load config:', err));
    }, []);

    const handleSave = async () => {
        setStatus('Saving...');
        try {
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...config, adminPin })
            });
            if (res.ok) {
                setStatus('Success');
                setTimeout(() => setStatus('Idle'), 2000);
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to save');
                setStatus('Error');
            }
        } catch (e) {
            setStatus('Error');
            alert('Network error');
        }
    };

    const addSource = () => {
        if (newSource.name && newSource.url) {
            setConfig({ ...config, sources: [...config.sources, newSource] });
            setNewSource({ name: '', url: '' });
        }
    };

    const removeSource = (index) => {
        const updated = config.sources.filter((_, i) => i !== index);
        setConfig({ ...config, sources: updated });
    };

    const addKeyword = () => {
        if (newKeyword && !config.keywords.includes(newKeyword)) {
            setConfig({ ...config, keywords: [...config.keywords, newKeyword] });
            setNewKeyword('');
        }
    };

    const removeKeyword = (kw) => {
        setConfig({ ...config, keywords: config.keywords.filter(k => k !== kw) });
    };

    return (
        <div className="admin-container">
            <header className="header">
                <h1>Notion-News-Hub <span>Hub</span></h1>
                <div className={`status-badge ${status.toLowerCase()}`}>
                    <span className="indicator"></span>
                    {status}
                </div>
            </header>

            <div className="grid">
                <section className="card">
                    <h2>RSS Sources</h2>
                    <div className="input-group">
                        <input
                            placeholder="Name (e.g. BBC)"
                            value={newSource.name}
                            onChange={e => setNewSource({ ...newSource, name: e.target.value })}
                        />
                        <input
                            placeholder="RSS URL"
                            value={newSource.url}
                            onChange={e => setNewSource({ ...newSource, url: e.target.value })}
                        />
                        <button onClick={addSource} className="btn-add">+</button>
                    </div>
                    <ul className="list">
                        {config.sources.map((s, i) => (
                            <li key={i}>
                                <span>{s.name}</span>
                                <button onClick={() => removeSource(i)} className="btn-del">×</button>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="card">
                    <h2>Keywords</h2>
                    <div className="input-group">
                        <input
                            placeholder="Add Tag..."
                            value={newKeyword}
                            onKeyDown={e => e.key === 'Enter' && addKeyword()}
                            onChange={e => setNewKeyword(e.target.value)}
                        />
                        <button onClick={addKeyword} className="btn-add">+</button>
                    </div>
                    <div className="tags">
                        {config.keywords.map(kw => (
                            <span key={kw} className="tag">
                                {kw}
                                <button onClick={() => removeKeyword(kw)}>×</button>
                            </span>
                        ))}
                    </div>
                </section>

                <section className="card full-width">
                    <h2>System Settings</h2>
                    <div className="settings-row">
                        <div className="field">
                            <label>Sync Interval</label>
                            <div className="split-input">
                                <input
                                    type="number"
                                    value={config.interval.value}
                                    onChange={e => setConfig({ ...config, interval: { ...config.interval, value: e.target.value } })}
                                />
                                <select
                                    value={config.interval.unit}
                                    onChange={e => setConfig({ ...config, interval: { ...config.interval, unit: e.target.value } })}
                                >
                                    <option>Minutes</option>
                                    <option>Hours</option>
                                </select>
                            </div>
                        </div>
                        <div className="field">
                            <label>Admin PIN</label>
                            <input
                                type="password"
                                placeholder="PIN"
                                value={adminPin}
                                onChange={e => setAdminPin(e.target.value)}
                            />
                        </div>
                    </div>
                </section>
            </div>

            <footer className="footer">
                <button onClick={handleSave} className="btn-primary">Submit Changes</button>
            </footer>
        </div>
    )
}

export default App
