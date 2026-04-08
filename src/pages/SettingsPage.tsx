import { useState } from 'react';
import { Link } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { Card, Button, Input, Modal } from '../components/ui';
import { useChildStore } from '../store';
import { formatAge, calculateAgeBand } from '../lib/dateUtils';
import { AGE_BAND_LABELS } from '../types';
import type { ChildProfile } from '../types';

export function SettingsPage() {
  const { children, addChild, updateChild, removeChild, activeChildId } = useChildStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');

  const resetForm = () => {
    setName('');
    setDob('');
  };

  const handleAdd = () => {
    if (!name.trim() || !dob) return;
    addChild({
      id: nanoid(),
      name: name.trim(),
      dateOfBirth: dob,
      ageBand: calculateAgeBand(dob),
      preferences: [],
      sensitivities: [],
      languageEnvironment: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    resetForm();
    setShowAddModal(false);
  };

  const handleEdit = () => {
    if (!editingChild || !name.trim() || !dob) return;
    updateChild(editingChild.id, {
      name: name.trim(),
      dateOfBirth: dob,
      ageBand: calculateAgeBand(dob),
    });
    setEditingChild(null);
    resetForm();
  };

  const openEdit = (child: ChildProfile) => {
    setEditingChild(child);
    setName(child.name);
    setDob(child.dateOfBirth);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-800">Settings</h1>
        <p className="text-sm text-surface-500">Manage children and preferences</p>
      </div>

      {/* Children */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wide">Children</h2>
          <Button variant="secondary" size="sm" onClick={() => { resetForm(); setShowAddModal(true); }}>
            + Add Child
          </Button>
        </div>

        <div className="space-y-2">
          {children.map((child) => (
            <Card key={child.id} hover onClick={() => openEdit(child)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                    ${child.id === activeChildId ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600'}
                  `}>
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-surface-800">
                      {child.name}
                      {child.id === activeChildId && (
                        <span className="ml-2 text-[10px] text-primary-500 font-normal">Active</span>
                      )}
                    </div>
                    <div className="text-xs text-surface-400">
                      {formatAge(child.dateOfBirth)} · {AGE_BAND_LABELS[child.ageBand]}
                    </div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Import / Export */}
      <section>
        <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wide mb-3">Data</h2>
        <Link to="/import-export">
          <Card hover>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">📦</span>
                <div>
                  <div className="text-sm font-medium text-surface-800">Import & Export Plans</div>
                  <div className="text-xs text-surface-400">Import JSON plans or export existing ones</div>
                </div>
              </div>
              <svg className="w-4 h-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Card>
        </Link>
      </section>

      {/* About */}
      <section>
        <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wide mb-3">About</h2>
        <Card>
          <div className="text-sm text-surface-500 space-y-1">
            <p><span className="text-surface-700 font-medium">NurtureOS</span> v0.1.0</p>
            <p>Montessori Home Execution System for Ages 2–6</p>
          </div>
        </Card>
      </section>

      {/* Add Child Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Child">
        <div className="space-y-4">
          <Input label="Name" placeholder="e.g. Aarav" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().split('T')[0]} />
          {dob && (
            <p className="text-xs text-surface-500">
              Age band: <span className="font-medium text-primary-600">{AGE_BAND_LABELS[calculateAgeBand(dob)]}</span>
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button fullWidth onClick={handleAdd} disabled={!name || !dob}>Add</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Child Modal */}
      <Modal isOpen={!!editingChild} onClose={() => setEditingChild(null)} title="Edit Child">
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().split('T')[0]} />
          {dob && (
            <p className="text-xs text-surface-500">
              Age band: <span className="font-medium text-primary-600">{AGE_BAND_LABELS[calculateAgeBand(dob)]}</span>
            </p>
          )}
          <div className="flex gap-2">
            {children.length > 1 && editingChild && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  removeChild(editingChild.id);
                  setEditingChild(null);
                  resetForm();
                }}
              >
                Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="secondary" onClick={() => { setEditingChild(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!name || !dob}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
