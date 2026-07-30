/* Local playground for langsys-js-solid — the same minimal app as the
   langsys-demos apps, in Solid. Imports the library straight from ../src so
   edits hot-reload. */
import { render } from 'solid-js/web';
import { For, createSignal } from 'solid-js';
import {
    DontTranslate,
    LangsysApp,
    LangsysAppAPI,
    Phrase,
    Translate,
    createLocaleStore,
    useCurrentLocale,
    useSignal,
    useT,
} from '../src/index.js';
import './demo.css';

const locale = createLocaleStore('en-US');
const LOCALES: Record<string, string> = {
    'en-US': 'English',
    'es-ES': 'Español',
    'fr-FR': 'Français',
    'de-DE': 'Deutsch',
};

// Optional: point the SDK at a non-production instance (local dev). Leave
// unset in production and it defaults to api.langsys.dev.
const apiUrl = import.meta.env.VITE_LANGSYS_API_URL;
if (apiUrl) LangsysAppAPI.setBaseUrl(apiUrl);

void LangsysApp.init({
    projectid: import.meta.env.VITE_LANGSYS_PROJECT_ID,
    key: import.meta.env.VITE_LANGSYS_API_KEY, // read-only in the browser
    UserLocaleStore: locale,
});

function Stepper(props: { count: number; onChange: (next: number) => void }) {
    return (
        <div class="stepper" translate="no">
            <button aria-label="Fewer" onClick={() => props.onChange(Math.max(0, props.count - 1))}>
                −
            </button>
            <span class="count">{props.count}</span>
            <button aria-label="More" onClick={() => props.onChange(props.count + 1)}>
                +
            </button>
        </div>
    );
}

function App() {
    const t = useT();
    const selected = useSignal(locale);
    const loaded = useCurrentLocale();
    const [inboxCount, setInboxCount] = createSignal(3);
    const [cartCount, setCartCount] = createSignal(3);

    return (
        <div class="app">
            <header class="topbar">
                <div class="brand">
                    <span class="logo">◆</span> <span translate="no">Langsys</span> × Solid
                </div>
                <nav class="locales" translate="no">
                    <For each={Object.keys(LOCALES)}>
                        {(code) => (
                            <button
                                classList={{ pill: true, active: (loaded() || 'en-US') === code }}
                                onClick={() => locale.set(code)}
                            >
                                {LOCALES[code]}
                            </button>
                        )}
                    </For>
                </nav>
            </header>

            <section class="card">
                <h2>
                    <code>useT()</code> — inline string, in a component
                </h2>
                <div class="live">
                    <p>{t()('Hello, {name}!', 'Greetings', { name: 'Sarah' })}</p>
                </div>
            </section>

            <section class="card">
                <h2>
                    <code>useT()</code> — ICU plurals
                </h2>
                <div class="live">
                    <p>
                        {t()(
                            'Hello, {name}! You have {count, plural, one {# new message} other {# new messages}}.',
                            'Greetings',
                            { name: 'Sarah', count: inboxCount() }
                        )}
                    </p>
                    <Stepper count={inboxCount()} onChange={setInboxCount} />
                </div>
                <p class="hint">
                    Change count to 1 and back — the grammar follows. Every locale applies its own plural rules.
                </p>
            </section>

            <section class="card">
                <h2>
                    <code>&lt;Translate&gt;</code> — content block
                </h2>
                <div class="live">
                    <Translate category="Home">
                        <h3>Welcome to our store</h3>
                        <p>Browse the catalog in your language.</p>
                    </Translate>
                </div>
            </section>

            <section class="card">
                <h2>
                    <code>&lt;Phrase&gt;</code> — params &amp; markup
                </h2>
                <div class="live">
                    <Phrase category="Cart" params={{ name: 'Sarah', count: cartCount() }}>
                        Hi %name%, you have %count% items in your cart.
                    </Phrase>
                    <Stepper count={cartCount()} onChange={setCartCount} />
                </div>
            </section>

            <section class="card">
                <h2>
                    <code>&lt;DontTranslate&gt;</code> — never translated
                </h2>
                <div class="live">
                    <Translate category="Tour">
                        <p>
                            Welcome! <DontTranslate>This sentence always stays in English.</DontTranslate> Thanks for
                            visiting!
                        </p>
                    </Translate>
                </div>
            </section>

            <footer class="meta" translate="no">
                selected {selected()} · loaded {loaded() || 'en-US'}
            </footer>
        </div>
    );
}

render(() => <App />, document.getElementById('root')!);
