import { ConsoleCard, ConsolePage, FlowButton, FlowNotice } from '@yahel/ui';
import type { ConsoleCrumb } from '@yahel/ui';
import { fieldsMessages as m } from './messages';

export interface FieldsPageProps {
  crumbs: ConsoleCrumb[];
  crumbsLabel: string;
}

/** The details kept on everyone's profile. Custom fields have no endpoint yet, so only the built-in ones are listed and adding is disabled. */
export function FieldsPage({ crumbs, crumbsLabel }: FieldsPageProps) {
  return (
    <ConsolePage
      crumbs={[...crumbs, { label: m.title }]}
      crumbsLabel={crumbsLabel}
      title={m.title}
      lede={m.lede}
      actions={
        <FlowButton variant="primary" isDisabled aria-describedby="fields-later">
          {m.add}
        </FlowButton>
      }
    >
      <FlowNotice tone="info">
        <span id="fields-later">{m.later}</span>
      </FlowNotice>
      <ConsoleCard title={m.yours} icon="edit">
        <p className="ws-console-muted">{m.noneYet}</p>
      </ConsoleCard>
      <h2 className="users-fields__heading">{m.builtIn}</h2>
      <div className="ws-console-cards">
        {m.groups.map((group) => (
          <ConsoleCard key={group.name} title={group.name} level={3}>
            <p className="ws-console-muted">{group.about}</p>
            <ul className="users-fields__list">
              {group.fields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </ConsoleCard>
        ))}
      </div>
    </ConsolePage>
  );
}
