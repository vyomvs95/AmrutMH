import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import { SchemeBand } from '../components/Scheme'
import { org } from '../lib/content'

/* आमच्याविषयी — the live about_us.php, word for word. */
const PARAS = [
  'महाराष्ट्र संशोधन, उन्नती आणि प्रशिक्षण प्रबोधिनी अर्थात अमृत ही महाराष्ट्र शासनाची स्वायत्त संस्था असून, अन्य कोणतेही सरकारी लाभ न मिळणाऱ्या खुल्या गटातील आर्थिकदृष्ट्या दुर्बल घटकांसाठी या संस्थेच्या विविध योजना आहेत.',
  'श्री. विजय जोशी हे संस्थेचे व्यवस्थापकीय संचालक असून, ‘अमृत’च्या राज्यभरातील लक्ष्यित गटापर्यंत संस्थेच्या योजना पोहोचवण्याचे कार्य त्यांच्या मार्गदर्शनाखाली मोठ्या प्रमाणात सुरू आहे.',
  'त्यांच्याच संकल्पनेतून ‘अमृत महाराष्ट्र’ हे पोर्टल सुरू करण्यात आले आहे. ‘अमृत महाराष्ट्र’ हा प्रेरणेचा सुधाकुंभ ठरावा आणि त्यातील सकारात्मक विचारांचे अमृत नवी उमेद देणारे, प्रगतीची दिशा दाखवणारे ठरावे, हा उद्देश त्यामागे आहे.',
  'सामाजिक बांधिलकी म्हणून सुरू केलेल्या या उपक्रमातून ‘अमृत’ संस्थेशी निगडित घटना-घडामोडी-योजनांची माहिती मिळेलच; पण ग्रामीण, सामाजिक आणि सांस्कृतिक जीवनाचे सकारात्मक दर्शनही घडवले जाणार आहे.',
  'अध्यात्मापासून व्यावसायिकतेपर्यंतच्या विषयांमधील जे जे उत्तम, उदात्त, उन्नत असेल, त्याचे दर्शन घडवण्याचा प्रयत्न केला जाईल. समाजाला प्रेरणा देणे, आशेचे नवे किरण दाखवणे, युवा पिढीचे सामाजिक संघटन उभारून एक सामर्थ्यवान पिढी घडवणे हा यामागचा उद्देश आहे.',
]

export default function About() {
  useEffect(() => {
    document.title = 'आमच्याविषयी — अमृत महाराष्ट्र'
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <section className="border-b border-warm-200 bg-cream">
        <div className="mx-auto max-w-[86rem] px-5 py-9 sm:px-8 sm:py-14">
          <nav aria-label="मार्ग" className="meta flex items-center gap-2">
            <Link to="/" className="transition-colors hover:text-saffron-deep">मुख्य पृष्ठ</Link>
            <span className="text-warm-300" aria-hidden="true">/</span>
            <span className="text-ink-2">आमच्याविषयी</span>
          </nav>
          <h1 className="mt-5 font-serif text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.24] text-ink">आमच्याविषयी</h1>
          <p className="lede mt-3.5">अमृत महाराष्ट्र - श्रमेव जयते</p>
        </div>
      </section>

      <div className="mx-auto max-w-[64rem] px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16">
          <div className="prose-mr">
            {PARAS.map((p, i) => (
              <Reveal key={i} delay={i * 60}>
                <p>{p}</p>
              </Reveal>
            ))}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-warm-200 p-6">
              <p className="label">संपर्क</p>
              <p className="mt-3 font-serif text-[1.02rem] leading-relaxed text-ink-2">{org.mr}</p>
              <p className="meta mt-1">{org.sub}</p>
              <p className="mt-4 text-[14.5px] leading-relaxed text-ink-2">{org.address}</p>
              <a href={`tel:${org.phone.replace(/\s/g, '')}`} className="mt-4 block font-serif text-[1.05rem] text-saffron-deep">
                {org.phone}
              </a>
              <a href={`mailto:${org.email}`} className="mt-1 block break-all text-[14.5px] text-saffron-deep">
                {org.email}
              </a>
              <Link
                to="/amrut-parivar-survey"
                className="mt-6 inline-flex rounded-full bg-saffron px-5 py-2.5 text-[14.5px] font-semibold text-white transition-colors hover:bg-saffron-deep"
              >
                अमृत परिवार सर्वेक्षण
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <SchemeBand />
    </>
  )
}
