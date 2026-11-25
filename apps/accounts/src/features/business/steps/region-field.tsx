import { useQuery } from '@tanstack/react-query';
import { FlowSelect, FlowTextField } from '@yahel/ui';
import { statesQuery } from '../../../flow/countries';
import { ListUnavailable } from '../../../flow/list-unavailable';
import { useStepField } from '../../../flow/use-step-field';
import { businessMessages as m } from '../messages';
import { stateProblem } from '../validation';

/** The state of an address: chosen from the backend's states for the country, or typed where it lists none. */
export function useRegion(country: string, initial = '') {
  const states = useQuery(statesQuery(country));
  const listed = (states.data?.length ?? 0) > 0;
  const field = useStepField<HTMLInputElement & HTMLSelectElement>({ initial, problemOf: (value) => stateProblem(value, listed), label: listed ? m.state : m.region });
  return { field, states, listed };
}

export function RegionField({ region, name, autoComplete }: { region: ReturnType<typeof useRegion>; name: string; autoComplete: string }) {
  const { field, states, listed } = region;
  if (!states.data) return <ListUnavailable label={m.region} failed={states.isError} onRetry={() => void states.refetch()} />;
  return listed ? (
    <FlowSelect label={m.state} name={name} autoComplete={autoComplete} value={field.value} onChange={field.change} error={field.error} inputRef={field.inputRef} isSensitive>
      <option value="">{m.chooseState}</option>
      {states.data.map((entry) => (
        <option key={entry.isoCode} value={entry.name}>
          {entry.name}
        </option>
      ))}
    </FlowSelect>
  ) : (
    <FlowTextField label={m.region} name={name} autoComplete={autoComplete} value={field.value} onChange={field.change} onBlur={field.blur} error={field.error} inputRef={field.inputRef} isRequired isSensitive />
  );
}
