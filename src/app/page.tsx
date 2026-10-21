import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Postmark } from "@/components/postmark";
import { RhythmDemo } from "@/components/rhythm-demo";
import { SiteFooter } from "@/components/site-footer";
import { Stamp } from "@/components/stamp";
import { Wordmark } from "@/components/wordmark";
import { postmarkParts } from "@/lib/format";
import { FREE_RECIPIENTS, PACK_PRICE_INR, PACK_SIZE } from "@/lib/pricing";
import styles from "./landing.module.css";

export const revalidate = 3600;

const QUESTIONS = [
  {
    q: "What if I'm travelling, ill, or just busy?",
    a: "Nothing goes out the moment you miss a check-in. We remind you before it's due, when it's missed, and once more before anything is sent, on email and on SMS or WhatsApp if you turn them on. A tap on any of those reminders counts. If you're often away, choose a longer rhythm.",
  },
  {
    q: "Could a letter go out by mistake?",
    a: "Only if you ignore every reminder for the whole grace period. Even then, if you turn out to be fine, you can log in and close the links so nobody can open your letters.",
  },
  {
    q: "Who can read what I write?",
    a: "Your letters are encrypted in our database. Before they're sent, only you can see them in your account. Afterwards, each person can open only the letters you addressed to them, through their own link. This is not end-to-end encryption: our server decrypts a letter at the moment it is shown.",
  },
  {
    q: "What do the people I add need to do?",
    a: "Nothing, until the day it matters. They don't need an app or an account, and we don't contact them before then. On the day, they get a message with a private link.",
  },
  {
    q: "Is this a will?",
    a: "No. Keepsake carries your words to people. It doesn't replace a will, a nominee, or legal advice, though it's a good place to tell someone where those papers are.",
  },
];

export default function Home() {
  const today = postmarkParts(new Date(), "Asia/Kolkata");
  const host = new URL(process.env.APP_URL ?? "http://localhost:3000").host;

  return (
    <>
      <header className={styles.header}>
        <Wordmark />
        <nav aria-label="Main" className={styles.nav}>
          <a href="#how" className={styles.navHide}>
            How it works
          </a>
          <a href="#price" className={styles.navHide}>
            Price
          </a>
          <Link href="/login">Log in</Link>
          <Link href="/signup" className="btn btn-small">
            Start free
          </Link>
        </nav>
      </header>

      <main id="main">
        <section className={styles.face} aria-labelledby="hero-title">
          <div className={styles.faceInner}>
            <div className={styles.postage}>
              <Stamp value="₹0" caption={`your first ${FREE_RECIPIENTS} people`} className={styles.stamp} tilt={3} />
              <Postmark date={today.date} className={styles.postmark} tilt={-12} />
            </div>

            <div className={styles.address}>
              <h1 id="hero-title" className={`hand ${styles.addressLines}`}>
                <span className={styles.to}>To,</span>
                <span className={styles.ruled}>
                  <span>the people I love,</span> <span>wherever they are.</span>
                </span>
              </h1>
            </div>

            <p className={styles.lede}>
              Write them a letter now. Keepsake keeps it sealed and checks on you, every few hours or every few months,
              on a rhythm you choose. If you stop answering, we deliver it to them on WhatsApp, SMS and email.
            </p>

            <div className={styles.sender}>
              <p className={styles.senderLabel}>
                From <span lang="hi">/ प्रेषक</span>
              </p>
              <div className={styles.senderBody}>
                <Link href="/signup" className="btn btn-big">
                  Start writing, free <ArrowRight aria-hidden="true" />
                </Link>
                <p className={styles.senderNote}>
                  Your first {FREE_RECIPIENTS} people are free. ₹{PACK_PRICE_INR} for every {PACK_SIZE} more, paid once.
                </p>
              </div>
            </div>
          </div>
          <p className={`fold ${styles.foldLine}`} aria-hidden="true">
            fold here <span lang="hi">/ यहाँ से मोड़ें</span>
          </p>
        </section>

        <section id="how" className={styles.inside} aria-labelledby="how-title">
          <div className={styles.insideSheet}>
            <div className={styles.letterCol}>
              <h2 id="how-title" className={styles.h2}>
                It only moves if you go quiet
              </h2>
              <div className={`read ${styles.letterText}`}>
                <p>
                  Pick how often we should hear from you. Every six hours if you want someone watching closely. Every few
                  months if you&rsquo;d rather be left alone.
                </p>
                <p>
                  Each time, one tap on a WhatsApp message, a text or an email is enough to say <em>I&rsquo;m still here</em>.
                  Logging in counts too.
                </p>
                <p>
                  Miss one, and we don&rsquo;t panic. We remind you, then remind you again, and only after a final warning
                  do your letters go out.
                </p>
              </div>
              <p className={`hand ${styles.margin}`} aria-hidden="true">
                choose the slowest rhythm you can live with
              </p>
            </div>
            <div className={styles.demoCol}>
              <RhythmDemo />
            </div>
          </div>
        </section>

        <section className={styles.receive} aria-labelledby="receive-title">
          <div className={styles.receiveText}>
            <h2 id="receive-title" className={styles.h2}>
              What Asha would get
            </h2>
            <p>
              A short message, not a shock. It says who it&rsquo;s from and why it came, and holds a link that only works for
              her.
            </p>
            <p>
              The link opens a quiet page with the letters meant for her and nothing else: no app, no account, no
              advertising. She can print them or keep the page.
            </p>
          </div>

          <figure className={styles.example}>
            <figcaption className={styles.exampleTag}>Example</figcaption>
            <div className={styles.bubble}>
              <p>
                Asha, Ravi Menon left a letter for you and asked Keepsake to send it if they stopped checking in. Read it
                here:
              </p>
              <p className={styles.bubbleLink}>{host}/l/7hQ2…</p>
              <span className={styles.bubbleTime}>10:12 am</span>
            </div>
            <div className={styles.opened}>
              <p className={`hand ${styles.openedSalute}`}>Dear Asha,</p>
              <p className={`read ${styles.openedBody}`}>
                The keys to the flat are with Mrs Pillai downstairs, and the papers you&rsquo;ll need are in the blue file in
                the steel almirah. Don&rsquo;t let anyone talk you into selling Amma&rsquo;s sewing machine.
              </p>
              <p className={`hand ${styles.openedSign}`}>Ravi</p>
            </div>
          </figure>
        </section>

        <section id="price" className={styles.price} aria-labelledby="price-title">
          <h2 id="price-title" className={styles.h2}>
            Three people are free
          </h2>
          <div className={styles.priceBody}>
            <div className={styles.stamps}>
              <Stamp value="₹0" caption={`your first ${FREE_RECIPIENTS} people`} className={styles.priceStamp} tilt={-3} />
              <Stamp value={`₹${PACK_PRICE_INR}`} caption={`${PACK_SIZE} more people, paid once`} className={styles.priceStamp} tilt={2} motif="garland" />
            </div>
            <dl className={styles.priceList}>
              <div>
                <dt>₹0</dt>
                <dd>
                  Your first {FREE_RECIPIENTS} people, with as many letters as you like, on any rhythm.
                </dd>
              </div>
              <div>
                <dt>₹{PACK_PRICE_INR}</dt>
                <dd>
                  Room for {PACK_SIZE} more people. Paid once through Dodo Payments, and yours for good. No subscription.
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className={styles.questions} aria-labelledby="faq-title">
          <h2 id="faq-title" className={styles.h2}>
            Fair questions
          </h2>
          <div className={styles.qList}>
            {QUESTIONS.map((item) => (
              <details key={item.q} className={styles.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.close} aria-labelledby="close-title">
          <h2 id="close-title" className={`hand ${styles.closeTitle}`}>
            Write the first one tonight.
          </h2>
          <Link href="/signup" className="btn btn-big">
            Start writing, free <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
