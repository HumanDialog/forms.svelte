
// https://flagdownload.com/

let languages = [
	{
		key: "en",
		name: 'English',
		flag: '/landing/lang/GB_64.png',
		default: true
	},
	{
		key: 'es',
		name: "Español",
		flag: '/landing/lang/ES_64.png'
	},
	{
		key: 'pl',
		name: 'Polski',
		flag: '/landing/lang/PL_64.png'
	}
]

function fetchCurrentLangIndex()
{
	const stored = localStorage.getItem("__hd_svelte_lang")
	if(!stored)
	{
		if(languages.length == 0)
			return 0;

		if(!navigator.language)
			return 0;

		const browserLang = navigator.language.substring(0, 2)
		const idx = languages.findIndex(l => l.key == browserLang)
		if(idx >=0)
			return idx;
		else
			return 0;
	}
	else
	{
		try{
			return JSON.parse(stored)
		}
		catch(err)
		{
			return 0;
		}
	}
}

let currentLangIndex = 0// fetchCurrentLangIndex()
let defaultLangIndex = 0;

export function setLanguages(langs)
{
	languages = langs
	defaultLangIndex = languages.findIndex(l => l.default == true)
	if(defaultLangIndex < 0)
		defaultLangIndex = 0

	currentLangIndex = fetchCurrentLangIndex()
}

export function getLanguages()
{
	return languages
}

export function setCurrentLanguage(sel)
{
	if(typeof sel === 'number')
		currentLangIndex = sel
	else if (typeof sel === 'string' || sel instanceof String)
	{
		currentLangIndex = languages.findIndex(l => l.key == sel)
		if(currentLangIndex < 0)
		{
			console.error(`language ${sel} doesn't exist`)
			currentLangIndex = defaultLangIndex
		}
	}
	else
	{
		currentLangIndex = languages.findIndex(l => l.key == sel.key)
		if(currentLangIndex < 0)
		{
			console.error(`language ${sel.key} doesn't exist`)
			currentLangIndex = defaultLangIndex
		}
	}

	localStorage.setItem("__hd_svelte_lang", JSON.stringify(currentLangIndex))
	
}

export function getCurrentLanguage()
{
	return languages[currentLangIndex]
}

export function getCurrentLanguageIdx()
{
	return currentLangIndex
}

export function getCurrentLanguageKey()
{
	return languages[currentLangIndex].key
}


/**
 * i18n("EN; ES; PL") => "EN" albo "ES" albo "PL"
 */

export function i18n(list) 
{
	if (typeof list === 'string' || list instanceof String) 
	{
		const parts = list.split(/\s*;\s*/);

		if(parts.length == 0)
			return "";
		
		if(currentLangIndex < parts.length)
			return parts[currentLangIndex]
		else if(defaultLangIndex < parts.length)
			return parts[defaultLangIndex]
		else
			return parts[0]
	}
	else if (Array.isArray(list)) 
	{
		if(list.length == 0)
			return "";
		
		if(currentLangIndex < list.length)
			return list[currentLangIndex]
		else if(defaultLangIndex < list.length)
			return list[defaultLangIndex]
		else
			return list[0]
  	}
	else 
	{
		let langKey = languages[currentLangIndex].key
		if (Object.keys(list).includes(langKey))
			return list[langKey]
		else 
		{
			langKey = languages[defaultLangIndex].key
			const keys = Object.keys(list)
			if (keys.includes(langKey))
				return list[langKey]
			else
				return list[keys[0]] 
		}
	}
}

export function extractTranslated(str)
{
	if(str.startsWith('_;'))
	{
		const body = str.replace(/^_;\s*/, '');   			// cut prefix "_;  "
		return i18n(body);
	}
	else if(str.startsWith('__;'))
	{
		const body = str.replace(/^__;\s*/, '');   			// cut prefix "__;  "
  		const PAIRS = /([A-Za-z]{2})\s*:\s*([^;]*)/g;
		const dict = {};
  		
		for (const [, code, text] of body.matchAll(PAIRS)) 
			dict[code.toLowerCase()] = text.trim();
		
		return i18n(dict)
	}
	else
		return str
}

export function ext(str)
{
	return extractTranslated(str)
}
