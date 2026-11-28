import { FlowButton, FlowChip, FlowChips, FlowIcon, FlowLink, UnitTree } from '@yahel/ui';
import type { UnitTreeUnit } from '@yahel/ui';
import { usersMessages } from './messages';

const m = usersMessages.units;

export type UnitPick = 'one' | 'several';

export interface UnitsPanelProps {
  tree: readonly UnitTreeUnit[];
  pick: UnitPick;
  selected: readonly string[];
  onChange: (next: { pick: UnitPick; units: string[] }) => void;
  manageHref: string;
  /** Hides the panel; left out where the panel is a sheet with its own close button. */
  onHide?: () => void;
}

/** The organisation's units, to show the people in one unit or several. */
export function UnitsPanel({ tree, pick, selected, onChange, manageHref, onHide }: UnitsPanelProps) {
  return (
    <section className="users-units" aria-label={m.label}>
      <div className="users-units__head">
        <h2 className="users-units__title">{m.title}</h2>
        {onHide ? (
          <FlowButton variant="round" aria-label={m.hide} onPress={onHide}>
            <FlowIcon name="back" />
          </FlowButton>
        ) : null}
      </div>
      <FlowChips label={m.how} isLabelHidden value={pick} onChange={(next) => onChange({ pick: next, units: next === 'one' ? selected.slice(0, 1) : [...selected] })} layout="segmented">
        <FlowChip value="one">{m.one}</FlowChip>
        <FlowChip value="several">{m.several}</FlowChip>
      </FlowChips>
      <UnitTree label={m.tree} units={tree} mode={pick} selected={selected} onChange={(units) => onChange({ pick, units })} toggleLabel={m.toggle} />
      <FlowLink href={manageHref} variant="link">
        {m.manage}
      </FlowLink>
    </section>
  );
}
