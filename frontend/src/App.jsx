import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/tasks`);
      setTasks(await res.json());
      setError('');
    } catch (e) {
      setError('Failed to load tasks — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setTitle(''); setDescription(''); setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API}/tasks/${editingId}` : `${API}/tasks`;
    const body = editingId
      ? { title, description, completed: tasks.find(t => t.id === editingId)?.completed || false }
      : { title, description };
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    resetForm();
    load();
  };

  const toggle = async (task) => {
    await fetch(`${API}/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, completed: !task.completed }),
    });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this task?')) return;
    await fetch(`${API}/tasks/${id}`, { method: 'DELETE' });
    load();
  };

  const edit = (task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
  };

  return (
    <div className="container">
      <h1>Tasks</h1>
      <p className="hint">A basic CRUD app — React + Node/Express + MySQL</p>

      <form onSubmit={submit} className="form">
        <input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="actions">
          <button type="submit">{editingId ? 'Update' : 'Add'}</button>
          {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      {error && <div className="error">{error}</div>}
      {loading && <div>Loading…</div>}

      <ul className="list">
        {tasks.map((t) => (
          <li key={t.id} className={t.completed ? 'done' : ''}>
            <input
              type="checkbox"
              checked={!!t.completed}
              onChange={() => toggle(t)}
            />
            <div className="text">
              <strong>{t.title}</strong>
              {t.description && <p>{t.description}</p>}
            </div>
            <div className="row-actions">
              <button onClick={() => edit(t)}>Edit</button>
              <button onClick={() => remove(t.id)} className="danger">Delete</button>
            </div>
          </li>
        ))}
        {!loading && tasks.length === 0 && <li className="empty">No tasks yet.</li>}
      </ul>
    </div>
  );
}
