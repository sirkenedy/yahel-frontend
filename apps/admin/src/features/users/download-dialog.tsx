import { Choice, ChoiceGroup, ConsoleDialog, FlowButton, FlowChip, FlowChips } from '@yahel/ui';
import { useState } from 'react';
import { notify } from '../../toast';
import { downloadMessages as m } from './messages';
import { peopleFile, saveFile } from './people-file';
import type { PeopleFormat, PeopleRow } from './people-file';

export interface DownloadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organisation: string;
  shown: readonly PeopleRow[];
  picked: readonly PeopleRow[];
}

/** Download the people on screen, or the ones selected, as CSV or JSON. */
export function DownloadDialog({ isOpen, onClose, organisation, shown, picked }: DownloadDialogProps) {
  const [who, setWho] = useState<'shown' | 'picked'>(picked.length ? 'picked' : 'shown');
  const [format, setFormat] = useState<PeopleFormat>('csv');
  const rows = who === 'picked' && picked.length ? picked : shown;

  return (
    <ConsoleDialog
      isOpen={isOpen}
      onOpenChange={(open) => (open ? undefined : onClose())}
      role="dialog"
      title={m.title}
      lede={m.lede}
      closeLabel={m.close}
      actions={
        <>
          <FlowButton variant="quiet" onPress={onClose}>
            {m.cancel}
          </FlowButton>
          <FlowButton
            variant="primary"
            isDisabled={rows.length === 0}
            onPress={() => {
              saveFile(`${m.fileName(organisation)}.${format}`, peopleFile(rows, format));
              notify(m.done);
              onClose();
            }}
          >
            {m.download}
          </FlowButton>
        </>
      }
    >
      <ChoiceGroup label={m.who} value={who} onChange={setWho}>
        <Choice value="shown" detail={m.shownDetail(shown.length)}>
          {m.shown}
        </Choice>
        {picked.length ? (
          <Choice value="picked" detail={m.pickedDetail(picked.length)}>
            {m.picked}
          </Choice>
        ) : null}
      </ChoiceGroup>
      <ChoiceGroup label={m.which} value="screen" onChange={() => undefined}>
        <Choice value="screen" detail={m.onScreenDetail}>
          {m.onScreen}
        </Choice>
      </ChoiceGroup>
      <p className="ws-console-note">{m.everyField}</p>
      <FlowChips label={m.format} value={format} onChange={setFormat} layout="segmented">
        <FlowChip value="csv">{m.csv}</FlowChip>
        <FlowChip value="json">{m.json}</FlowChip>
      </FlowChips>
      <p className="ws-console-note">
        {m.sheetsLater} {m.never}
      </p>
    </ConsoleDialog>
  );
}
