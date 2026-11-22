import { FlowButton, FlowCheckbox, FlowIcon, FlowStep, Receipt } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { maskedNumber } from '../countries';
import { writtenDate } from '../dates';
import { personalMessages as m } from '../messages';
import { usePersonalFlow } from '../personal-flow';
import type { ReviewRow } from '../personal-flow';
import { StepFrame } from './step-frame';

/** A value kept out of sight until asked for. Screen readers are told it is hidden, not read a row of dots. */
const hidden = (dots: string) => (
  <>
    <span aria-hidden="true">{dots}</span>
    <span className="ws-flow-hidden">{m.hiddenValue}</span>
  </>
);

export function ReviewStep() {
  const { state, actions, meta } = usePersonalFlow();
  const [shown, setShown] = useState(false);
  const { recovery, preferences } = state;
  const { terms, privacy } = meta.links;
  const ways = [recovery.phone ? maskedNumber(recovery.country, recovery.phone) : '', recovery.email].filter(Boolean);

  const rows: [ReviewRow, ReactNode][] = [
    ['name', state.fullName],
    ['address', state.address],
    ['birthday', state.birth ? (shown ? writtenDate(state.birth, m.locale) : hidden(m.hiddenBirthday)) : null],
    ['signIn', state.passkey ? m.signInPasswordAndPasskey : m.signInPassword],
    ['recovery', ways.length === 0 ? m.recoveryNone : shown ? ways.join(' · ') : hidden(m.hiddenRecovery(recovery.phone.replace(/\D/g, '').slice(-2)))],
  ];

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    actions.createAccount();
  };

  return (
    <StepFrame title={m.reviewTitle}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          <FlowStep.Links align="end">
            <FlowButton variant="link" aria-pressed={shown} onPress={() => setShown(!shown)}>
              <FlowIcon name={shown ? 'eye-off' : 'eye'} />
              {shown ? m.hidePrivate : m.showPrivate}
            </FlowButton>
          </FlowStep.Links>
          <Receipt label={m.reviewLabel}>
            {rows.map(([row, value]) => (
              <Receipt.Row
                key={row}
                label={m.rows[row]}
                action={
                  <FlowButton variant="link" aria-label={m.editLabels[row]} onPress={() => actions.edit(row)}>
                    {m.edit}
                  </FlowButton>
                }
              >
                {value}
              </Receipt.Row>
            ))}
          </Receipt>
          {meta.offers.preferences ? (
            <div>
              <FlowCheckbox isSelected={preferences.productNews} onChange={(productNews) => actions.setPreferences({ ...preferences, productNews })}>
                {m.tips}
              </FlowCheckbox>
              <FlowCheckbox isSelected={preferences.activityHistory} onChange={(activityHistory) => actions.setPreferences({ ...preferences, activityHistory })}>
                {m.activity}
              </FlowCheckbox>
              <FlowStep.Note>{m.choicesNote}</FlowStep.Note>
            </div>
          ) : null}
          <FlowStep.Note>
            {m.agreement.before}
            {terms ? (
              <FlowStep.NoteLink href={terms} newTabLabel={m.opensInNewTab}>
                {m.agreement.terms}
              </FlowStep.NoteLink>
            ) : (
              m.agreement.terms
            )}
            {m.agreement.between}
            {privacy ? (
              <FlowStep.NoteLink href={privacy} newTabLabel={m.opensInNewTab}>
                {m.agreement.privacy}
              </FlowStep.NoteLink>
            ) : (
              m.agreement.privacy
            )}
            {m.agreement.after}
          </FlowStep.Note>
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary">
            {m.create}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
    </StepFrame>
  );
}
