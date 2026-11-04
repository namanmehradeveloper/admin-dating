// Checkbox matrix: modules × actions for role permission editing.

import { formatEnum } from '../../utils/format.js';

const ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE'];

export default function PermissionMatrix({ modules, value, onChange, readOnly = false }) {
  const byModule = new Map((value ?? []).map((entry) => [entry.module, new Set(entry.actions ?? [])]));

  function toggle(module, action) {
    if (readOnly) return;
    const next = new Map(byModule);
    const set = new Set(next.get(module) ?? []);
    if (set.has(action)) set.delete(action);
    else set.add(action);
    if (set.size === 0) next.delete(module);
    else next.set(module, set);
    onChange(
      [...next.entries()].map(([mod, actions]) => ({
        module: mod,
        actions: ACTIONS.filter((item) => actions.has(item)),
      })),
    );
  }

  function toggleRow(module, enable) {
    if (readOnly) return;
    const next = new Map(byModule);
    if (enable) next.set(module, new Set(ACTIONS));
    else next.delete(module);
    onChange(
      [...next.entries()].map(([mod, actions]) => ({
        module: mod,
        actions: ACTIONS.filter((item) => actions.has(item)),
      })),
    );
  }

  function setAll(enable) {
    if (readOnly) return;
    if (!enable) {
      onChange([]);
      return;
    }
    onChange((modules ?? []).map((module) => ({ module, actions: [...ACTIONS] })));
  }

  return (
    <div className="perm-matrix">
      {!readOnly && (
        <div className="perm-matrix__toolbar">
          <button type="button" className="button button--secondary button--small" onClick={() => setAll(true)}>
            Grant all
          </button>
          <button type="button" className="button button--secondary button--small" onClick={() => setAll(false)}>
            Clear all
          </button>
        </div>
      )}
      <div className="table-wrap">
        <table className="table perm-matrix__table">
          <thead>
            <tr>
              <th>Module</th>
              {ACTIONS.map((action) => (
                <th key={action}>{formatEnum(action)}</th>
              ))}
              {!readOnly && <th>All</th>}
            </tr>
          </thead>
          <tbody>
            {(modules ?? []).map((module) => {
              const set = byModule.get(module) ?? new Set();
              const allOn = ACTIONS.every((action) => set.has(action));
              return (
                <tr key={module}>
                  <td>{formatEnum(module)}</td>
                  {ACTIONS.map((action) => (
                    <td key={action}>
                      <input
                        type="checkbox"
                        checked={set.has(action)}
                        disabled={readOnly}
                        onChange={() => toggle(module, action)}
                        aria-label={`${module} ${action}`}
                      />
                    </td>
                  ))}
                  {!readOnly && (
                    <td>
                      <input type="checkbox" checked={allOn} onChange={() => toggleRow(module, !allOn)} aria-label={`${module} all`} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
