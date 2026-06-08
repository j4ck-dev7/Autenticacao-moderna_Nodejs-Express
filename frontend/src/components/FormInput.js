import React from 'react';

export default function FormInput({ label, type = 'text', value, onChange }) {
  return (
    <div className="form-row">
      <label className="label">{label}</label>
      <input className="input" type={type} value={value} onChange={onChange} />
    </div>
  );
}
