import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ARCHIVE } from '../lib/content'

/**
 * अमृत परिवार सर्वेक्षण २०२६ — the live amrut_family_registration.php form,
 * same sections, fields, options and required rules, in this site's design.
 *
 * It posts to the existing survey handler with the original field names, so
 * submissions keep landing where AMRUT already collects them. When the new
 * backend replaces the old site, only ACTION needs to change.
 */
const ACTION = `${ARCHIVE}amrut_family_registration.php`

const CASTES = ['ब्राह्मण', 'कायस्थ', 'कोमटी/वैश्य', 'मारवाडी', 'पटेल', 'राजपूत', 'यलमार', 'अय्यंगार', 'राजपुरोहित', 'पाटीदार', 'नायर', 'नायडू', 'कम्मा', 'कानबी', 'सिंधी', 'बनिया', 'बंगाली', 'त्यागी', 'सेनगूनथर', 'गुजराथी', 'ठाकूर', 'जाट', 'लोहाना', 'हिंदू नेपाळी', 'भूमिहार', 'इतर']
const DISTRICTS = ['बुऱ्हानपुर', 'गडचिरोली', 'चंद्रपूर', 'गोंदिया', 'भंडारा', 'वर्धा', 'नागपूर', 'यवतमाळ', 'वाशीम', 'बुलडाणा', 'अकोला', 'अमरावती', 'जळगाव', 'अहिल्यानगर', 'नंदुरबार', 'धुळे', 'नाशिक', 'धाराशीव', 'लातूर', 'नांदेड', 'हिंगोली', 'परभणी', 'जालना', 'बीड', 'छत्रपती संभाजीनगर', 'सोलापूर', 'सांगली', 'कोल्हापूर', 'सातारा', 'पुणे', 'सिंधुदुर्ग', 'रत्नागिरी', 'रायगड', 'मुंबई उपनगर', 'मुंबई शहर', 'ठाणे', 'पालघर']
const GENDERS = ['स्त्री', 'पुरुष', 'Other']
const OCCUPATIONS = ['खाजगी नोकरी', 'सरकारी नोकरी', 'व्यवसाय', 'शेती', 'शिक्षण', 'गृहिणी', 'इतर']
const MEMBER_OCCUPATIONS = ['खाजगी नोकरी', 'सरकारी नोकरी', 'शेती', 'व्यवसाय', 'शिक्षण', 'गृहिणी']
const RELATIONS = ['आई', 'बाबा', 'मुलगा', 'मुलगी', 'भाऊ', 'बहीण', 'पती', 'पत्नी']
const INCOME = ['रुपये आठ लाख पेक्षा जास्त', 'रुपये आठ लाख पेक्षा कमी']
const ALL_SCHEMES = ['कौशल्य विकास प्रशिक्षण', 'वैयक्तिक व्याज परतावा', 'अमृत ड्रोन पायलट प्रशिक्षण', 'अमृत पेठ E commerce platform', 'अमृत पेठ थेट बाजारपेठ', 'अमृत वर्ग', 'अमृत पर्यटन', 'अमृत मानस मित्र']
const OTHER_CASTE_SCHEMES = ['अमृत पेठ E commerce platform', 'अमृत पेठ थेट बाजारपेठ', 'अमृत वर्ग', 'अमृत पर्यटन', 'अमृत मानस मित्र']
const SOCIAL = ['Facebook', 'YouTube', 'Instagram', 'Website', 'None of the above']
const SOURCES = ['वर्तमानपत्र', 'WhatsApp', 'Facebook', 'Instagram', 'अमृत चे वेबसाईटवरून', 'अमृत जिल्हा टीम', 'इतर']

const field =
  'w-full rounded-md border border-warm-200 bg-paper px-4 py-3 text-[16px] text-ink transition-colors focus:border-saffron focus:outline-none'

function Label({ children, required, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-[15px] font-semibold text-ink-2">
      {children}
      {required && <span className="text-saffron-deep"> *</span>}
    </label>
  )
}

function Select({ id, name, options, placeholder = '-- निवडा --', required, value, onChange }) {
  return (
    <select id={id} name={name} required={required} className={field} value={value} onChange={onChange}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

function Choice({ type = 'radio', name, options, required }) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((o, i) => (
        <label key={o} className="flex cursor-pointer items-center gap-2 rounded-full border border-warm-200 px-4 py-2 text-[15px] text-ink-2 has-[:checked]:border-saffron has-[:checked]:bg-cream">
          <input type={type} name={name} value={o} required={required && type === 'radio' && i === 0} className="accent-[var(--color-saffron-deep)]" />
          <span>{o}</span>
        </label>
      ))}
    </div>
  )
}

function Section({ n, title, children, note }) {
  return (
    <fieldset className="border-t border-warm-200 pt-8">
      <legend className="flex items-baseline gap-3 pr-3">
        <span className="font-serif text-[1.05rem] text-saffron-deep">{n}</span>
        <span className="font-serif text-[clamp(1.25rem,2.4vw,1.55rem)] text-ink">{title}</span>
      </legend>
      {note && <p className="meta mt-3 rounded-md bg-cream px-4 py-3 leading-relaxed">{note}</p>}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

export default function Survey() {
  const [caste, setCaste] = useState('')
  const [occupation, setOccupation] = useState('')
  const [members, setMembers] = useState(1)
  const otherCaste = caste === 'इतर'
  const schemes = otherCaste ? OTHER_CASTE_SCHEMES : ALL_SCHEMES

  useEffect(() => {
    document.title = 'अमृत परिवार सर्वेक्षण २०२६ — अमृत महाराष्ट्र'
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <section className="border-b border-warm-200 bg-cream">
        <div className="mx-auto max-w-[86rem] px-5 py-9 sm:px-8 sm:py-14">
          <nav aria-label="मार्ग" className="meta flex items-center gap-2">
            <Link to="/" className="transition-colors hover:text-saffron-deep">मुख्य पृष्ठ</Link>
            <span className="text-warm-300" aria-hidden="true">/</span>
            <span className="text-ink-2">सर्वेक्षण</span>
          </nav>
          <h1 className="mt-5 font-serif text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.24] text-ink">अमृत परिवार सर्वेक्षण २०२६</h1>
        </div>
      </section>

      <form
        method="POST"
        action={ACTION}
        id="registrationForm"
        onSubmit={(e) => {
          /* the live form requires at least one social-media answer */
          if (!e.currentTarget.querySelector('input[name="social_media_follow[]"]:checked')) {
            e.preventDefault()
            e.currentTarget.querySelector('input[name="social_media_follow[]"]').focus()
            alert('कृपया सोशल मीडिया पेजबद्दलचा पर्याय निवडा.')
          }
        }}
        className="mx-auto flex max-w-[52rem] flex-col gap-12 px-5 py-12 sm:px-8 sm:py-16">
        <Section n="१" title="वैयक्तिक माहिती">
          <div className="sm:col-span-2">
            <Label htmlFor="family_head_name" required>कुटुंब प्रमुखाचे संपूर्ण नाव</Label>
            <input id="family_head_name" name="family_head_name" type="text" required className={field} />
          </div>
          <div>
            <Label htmlFor="caste_category" required>जातीचा प्रवर्ग</Label>
            <Select id="caste_category" name="caste_category" options={CASTES} required value={caste} onChange={(e) => setCaste(e.target.value)} />
            {otherCaste && <input name="caste_other" type="text" required className={`${field} mt-3`} aria-label="इतर जात" />}
          </div>
          <div>
            <Label htmlFor="age" required>वय</Label>
            <input id="age" name="age" type="number" min="1" max="120" required className={field} />
          </div>
          <div>
            <Label htmlFor="gender" required>लिंग</Label>
            <Select id="gender" name="gender" options={GENDERS} placeholder="-- लिंग निवडा --" required />
          </div>
        </Section>

        <Section n="२" title="पत्ता माहिती">
          <div>
            <Label htmlFor="village_name" required>गावाचे नाव</Label>
            <input id="village_name" name="village_name" type="text" required className={field} />
          </div>
          <div>
            <Label htmlFor="district" required>जिल्हा</Label>
            <Select id="district" name="district" options={DISTRICTS} placeholder="-- जिल्हा निवडा --" required />
          </div>
          <div>
            <Label htmlFor="taluka" required>तालुका</Label>
            <input id="taluka" name="taluka" type="text" required className={field} />
          </div>
        </Section>

        <Section n="३" title="संपर्क माहिती">
          <div>
            <Label htmlFor="mobile_number" required>मोबाईल नंबर</Label>
            <input id="mobile_number" name="mobile_number" type="tel" inputMode="numeric" pattern="[0-9]{10}" required className={field} />
          </div>
          <div>
            <Label htmlFor="email">ईमेल</Label>
            <input id="email" name="email" type="email" className={field} />
          </div>
        </Section>

        <Section n="४" title="व्यावसायिक माहिती">
          <div>
            <Label htmlFor="current_occupation" required>सध्या काय करता ?</Label>
            <Select id="current_occupation" name="current_occupation" options={OCCUPATIONS} required value={occupation} onChange={(e) => setOccupation(e.target.value)} />
            {occupation === 'इतर' && <input name="current_occupation_other" type="text" required className={`${field} mt-3`} aria-label="इतर" />}
          </div>
          <div>
            <Label htmlFor="annual_income">कुटुंबाचे वार्षिक उत्पन्न</Label>
            <Select id="annual_income" name="annual_income" options={INCOME} placeholder="-- उत्पन्न निवडा --" />
          </div>
        </Section>

        <Section n="५" title="कुटुंबातील सदस्यांची माहिती">
          {Array.from({ length: members }, (_, i) => (
            <div key={i} className="grid gap-5 rounded-lg border border-warm-200 p-5 sm:col-span-2 sm:grid-cols-2">
              <p className="label sm:col-span-2">सदस्य {i + 1}</p>
              <div>
                <Label>नाव</Label>
                <input name="member_name[]" type="text" className={field} />
              </div>
              <div>
                <Label>वय</Label>
                <input name="member_age[]" type="number" min="0" max="120" className={field} />
              </div>
              <div>
                <Label>लिंग</Label>
                <Select name="member_gender[]" options={GENDERS} />
              </div>
              <div>
                <Label>कुटुंब प्रमुखाशी नाते</Label>
                <Select name="member_relationship[]" options={RELATIONS} />
              </div>
              <div className="sm:col-span-2">
                <Label>सध्या काय करता</Label>
                <Select name="member_occupation[]" options={MEMBER_OCCUPATIONS} />
              </div>
            </div>
          ))}
          <div className="flex gap-3 sm:col-span-2">
            <button type="button" onClick={() => setMembers((n) => n + 1)} className="rounded-full border border-saffron px-5 py-2 text-[14.5px] font-semibold text-saffron-deep hover:bg-cream">
              + सदस्य जोडा
            </button>
            {members > 1 && (
              <button type="button" onClick={() => setMembers((n) => n - 1)} className="rounded-full border border-warm-200 px-5 py-2 text-[14.5px] text-ink-2 hover:bg-warm-100">
                शेवटचा सदस्य काढा
              </button>
            )}
          </div>
        </Section>

        <Section n="६" title="अमृत योजना माहिती">
          {!otherCaste && (
            <div className="sm:col-span-2">
              <Label>अमृत योजनेचा लाभ हवा आहे का ?</Label>
              <Choice name="want_amrut_benefit" options={['हो', 'नाही']} />
            </div>
          )}
          <div className="sm:col-span-2">
            <Label required>अमृत संस्थेच्या कोणत्या सोशल मीडिया पेजला फॉलो केले आहे ?</Label>
            <Choice type="checkbox" name="social_media_follow[]" options={SOCIAL} />
          </div>
          <div className="sm:col-span-2">
            <Label>आपण अमृत च्या कोणत्या योजनेचा लाभ घेण्यास इच्छुक आहात ?</Label>
            <Choice type="checkbox" name="amrut_scheme_interested[]" options={schemes} />
          </div>
          <div className="sm:col-span-2">
            <Label>इतर शासकीय योजनांची माहिती सोशल मीडिया माध्यमातून जाणून घेण्यास इच्छुक आहात का ?</Label>
            <Choice name="govt_scheme_interest" options={['हो', 'नाही']} />
          </div>
        </Section>

        <Section
          n="७"
          title="स्वयंसेवक माहिती"
          note="अमृत या महाराष्ट्र शासनाच्या स्वायत्त संस्थेच्या ध्येय आणि उद्दिष्टांसाठी तसेच अमृत च्या सामाजिक उपक्रमात स्वेच्छेने स्वयंसेवक म्हणून सहभागी होवू इच्छिणाऱ्यानी पुढील माहिती भरावी."
        >
          <div className="sm:col-span-2">
            <Label>तुम्हाला किंवा तुमच्या कुटुंबातील सदस्याला शासकीय संस्थेसोबत अमृत मित्र / अमृत सखी म्हणून स्वयंसेवी पद्धतीने काम करायचे आहे का?</Label>
            <Choice name="volunteer_interest" options={['होय', 'नाही']} />
          </div>
          <div className="sm:col-span-2">
            <Label>तुम्ही किंवा तुमच्या कुटुंबातील सदस्य अमृत वर्गाच्या माध्यमातून राष्ट्रपुनर्निर्माण च्या कार्यात सहभागी होवू इच्छिता का ?</Label>
            <Choice name="nation_building_participation" options={['हो', 'नाही']} />
          </div>
          <div className="sm:col-span-2">
            <Label>तुम्ही कीवा तुमच्या कुटुंबातील सदस्य अमृत च्या योजनांचा प्रचार प्रसार कसा करणार ? (ऐच्छिक)</Label>
            <Choice type="checkbox" name="promotion_method[]" options={['सोशल मीडिया द्वारे', 'प्रत्यक्ष लोक संपर्कामधून']} />
          </div>
          <div className="sm:col-span-2">
            <Label>तुमच्या कुटुंबातील नोकरी व्यवसाय निमित्त कोणी स्थलांतरित झाले आहे का?</Label>
            <Choice name="migration_status" options={['हो', 'नाही']} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="survey_info_source" required>आपल्याला या सर्वेक्षणाची माहिती कोठून मिळाली ?</Label>
            <Select id="survey_info_source" name="survey_info_source" options={SOURCES} required />
          </div>
        </Section>

        <div className="flex flex-col gap-6 border-t border-warm-200 pt-8">
          <label className="flex items-start gap-3 text-[15px] leading-relaxed text-ink-2">
            <input type="checkbox" name="terms_accepted" value="1" required className="mt-1.5 accent-[var(--color-saffron-deep)]" />
            <span>
              मी वरील सर्व नियम व अटी वाचून समजून घेतल्या आहेत आणि त्या मान्य आहेत. <span className="text-saffron-deep">*</span>
            </span>
          </label>
          <button type="submit" className="self-start rounded-full bg-saffron px-8 py-3.5 text-[16px] font-semibold text-white transition-colors hover:bg-saffron-deep">
            नोंदणी करा
          </button>
        </div>
      </form>
    </>
  )
}
