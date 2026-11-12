import { scale } from '@yahel/tokens/tokens.json';
import { useScrollProgress } from '@yahel/ui';
import { homeMessages } from './messages';

const m = homeMessages.window;
const scrollDistance = Number.parseFloat(scale['size.hero-scroll']);

/**
 * A picture of the product, drawn in markup. It lies tilted and a little small, and comes flat and full size
 * over the first stretch of scroll. To a screen reader it is one image: its sample names and times are not content.
 */
export function HeroWindow() {
  return (
    <div ref={useScrollProgress<HTMLDivElement>(scrollDistance)} className="home-window" role="img" aria-label={m.label}>
      <div className="home-window__bar">
        <span className="home-window__lights">
          <span />
          <span />
          <span />
        </span>
        <span className="home-window__address">{m.address}</span>
        <span className="home-window__context">
          <span className="home-window__avatar">{m.initials}</span>
          {m.context}
        </span>
      </div>
      <div className="home-window__body">
        <p className="ws-title-1">{m.greeting}</p>
        <div className="home-window__cards">
          <div className="home-window__card" data-product="calendar">
            <p className="home-window__title">{m.today}</p>
            {m.events.map((event) => (
              <p key={event.name} className="home-window__row">
                <span>{event.name}</span>
                <span className="ws-secondary">{event.time}</span>
              </p>
            ))}
          </div>
          <div className="home-window__card" data-product="mail">
            <p className="home-window__title">{m.mail}</p>
            {m.unread.map((message) => (
              <p key={message.from} className="home-window__message">
                <span>{message.from}</span>
                <span className="ws-secondary">{message.subject}</span>
              </p>
            ))}
          </div>
          <div className="home-window__card" data-product="drive">
            <p className="home-window__title">{m.files}</p>
            {m.recent.map((file) => (
              <p key={file.name} className="home-window__file" data-product={file.product}>
                {file.name}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
