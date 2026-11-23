import { FlowButton, FlowCheckbox, FlowLink, FlowNotice, FlowPasswordField, FlowStep, FlowTextField, PasswordStrength } from '@yahel/ui';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { passwordStrength } from '../../../flow/credentials';
import { useStepField, useStepFields } from '../../../flow/use-step-field';
import { useBusinessFlow } from '../business-flow';
import { refusalFor } from '../feedback';
import { businessMessages as m } from '../messages';
import { confirmProblem, normaliseUsername, passwordProblem, usernameFromName, usernameProblem } from '../validation';
import { StepFrame } from './step-frame';

const named = (name: string, href: string | null): ReactNode =>
  href ? (
    <FlowStep.NoteLink href={href} newTabLabel={m.opensInNewTab}>
      {name}
    </FlowStep.NoteLink>
  ) : (
    name
  );

export function AdminStep() {
  const { state, actions, meta } = useBusinessFlow();
  const { links, offers } = meta;
  const [revealed, setRevealed] = useState(false);
  const [marketing, setMarketing] = useState(state.marketing);
  const refusal = refusalFor(state.rejection, 'admin');
  const username = useStepField({ initial: state.adminUser || usernameFromName(state.firstName), problemOf: usernameProblem, label: m.username, hasFormat: true, refusal });
  // The fields always start empty: a password already chosen is never put back on screen. Both left empty, it is kept.
  const keeps = () => state.hasPassword && password.value === '' && again.value === '';
  const password = useStepField({ problemOf: (value): string | null => (state.hasPassword && value === '' && again.value === '' ? null : passwordProblem(value)), label: m.password, hasFormat: true });
  const again = useStepField({ problemOf: (value): string | null => (state.hasPassword && value === '' && password.value === '' ? null : confirmProblem(value, password.value)), label: m.confirmPassword, hasFormat: true });
  const form = useStepFields([username, password, again]);
  const score = passwordStrength(password.value, state.firstName);
  const button = offers.billing ? m.agreeAndContinue : m.agreeAndCreate;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    // A revealed password is hidden again before anything else happens, so it is not left on screen.
    setRevealed(false);
    form.submit(event, () => actions.enterAdmin({ adminUser: normaliseUsername(username.value), password: keeps() ? null : password.value, marketing }));
  };

  return (
    <StepFrame title={m.adminTitle} lede={m.adminLede} toFix={form.toFix}>
      <FlowStep.Form onSubmit={submit}>
        <FlowStep.Body>
          <FlowTextField
            label={m.username}
            name="username"
            autoComplete="username"
            spellCheck="false"
            suffix={`@${state.domain}`}
            value={username.value}
            onChange={username.change}
            onBlur={username.blur}
            isValid={username.isValid}
            error={username.error}
            action={refusal ? <FlowLink href={links.signIn}>{m.signInInstead}</FlowLink> : undefined}
            inputRef={username.inputRef}
            isRequired
          />
          <FlowNotice title={m.codeMailboxTitle}>{m.codeMailbox(state.domain)}</FlowNotice>
          {state.hasPassword ? <FlowNotice>{m.passwordKept}</FlowNotice> : null}
          <FlowPasswordField showText={m.show} hideText={m.hide} showLabel={m.showPassword} hideLabel={m.hidePassword} isRevealed={revealed} onRevealedChange={setRevealed} autoComplete="new-password" label={m.password} name="new-password" help={m.passwordHelp} value={password.value} onChange={password.change} onBlur={password.blur} isValid={password.isValid} error={password.error} inputRef={password.inputRef} isRequired={!state.hasPassword} />
          <PasswordStrength score={score}>{m.strength(m.strengthVerdicts[score], password.value.length)}</PasswordStrength>
          {/* One "Show" serves both fields, as drawn: the second follows the first. */}
          <FlowTextField label={m.confirmPassword} name="confirm-password" type={revealed ? 'text' : 'password'} autoComplete="new-password" spellCheck="false" value={again.value} onChange={again.change} onBlur={again.blur} isValid={again.isValid} error={again.error} inputRef={again.inputRef} isRequired={!state.hasPassword} />
          {offers.marketing ? (
            <>
              <FlowCheckbox isSelected={marketing.productNews} onChange={(productNews) => setMarketing({ ...marketing, productNews })}>
                {m.productNews}
              </FlowCheckbox>
              <FlowCheckbox isSelected={marketing.teamTips} onChange={(teamTips) => setMarketing({ ...marketing, teamTips })}>
                {m.teamTips}
              </FlowCheckbox>
              <FlowStep.Note>{m.choicesOff}</FlowStep.Note>
            </>
          ) : null}
          <FlowStep.Note>
            {m.agreeByContinuing(button)}
            {named(m.businessAgreement, links.businessTerms)}
            {offers.billing ? m.and : null}
            {offers.billing ? named(m.trialTerms, links.trialTerms) : null}.
          </FlowStep.Note>
        </FlowStep.Body>
        <FlowStep.Actions>
          <FlowButton type="submit" variant="primary">
            {button}
          </FlowButton>
        </FlowStep.Actions>
      </FlowStep.Form>
    </StepFrame>
  );
}
