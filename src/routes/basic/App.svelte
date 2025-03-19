<script>
    import {reef, session, AuthorizedView, signInHRef, signUpHRef, Authorized, NotAuthorized} from '@humandialog/auth.svelte'
	import {Layout, onErrorShowAlert} from '$lib';
    import FaAmilia from 'svelte-icons/fa/FaAmilia.svelte'

    import Router from 'svelte-spa-router'
    
    import Cookies from './cookies.svelte';
    import Main from './main.svelte'
    import Contact from './landing/contact.svelte';
    import PrivacyPolicy from './landing/privacy.policy.svelte'
    import TermsAndConditions from './landing/terms.and.conditions.svelte'
    import NotFound from './landing/not.found.svelte'
    import AppView from './AppView.svelte';

    import { GoogleAnalytics } from '@beyonk/svelte-google-analytics'
    import {cookies_allow_analytics} from './landing/cookie.preferences'
    
    
	const mode = __APP_MODE__
    const objectreef_io = __OBJECTREEF_IO__
    const appId = __APP_ID__
    const tenantId = __TENANT_ID__
    const proto = __SERVICE_PROTOCOL__
    const clientID = __CLIENT_ID__
    const clientSecret = __CLIENT_SECRET__
    const website = __WEBSITE__

   reef.configure( {
                    mode: mode,
                    remote: {
                        iss: `${proto}://${objectreef_io}`,
                        clientID: clientID,
                        clientSecret: clientSecret,
                        scope: `openid profile email ${appId}`,
                        apiVersion: 'v001',
                        tenant: `${tenantId}`,
                        groupsOnly: true,
                        termsAndConditionsHRef: `${website}/#/terms-and-conditions`,
                        privacyPolicyHRef: `${website}/#/privacy-policy`
                    },
                    local: {
                        api:    "http://127.0.0.1:1996/",
                        //api:    "http://192.168.0.103:1996/",
                        users:
                        [
                            {
                                username: "alice@example.com",
                                role: 'GroupOwner',
                                groupId: 13
                            },
                            {
                                username: "bob@example.com",
                                role: 'GroupOwner',
                                groupId: 13
                            }
                        ],
                        apiVersion: "v001"}
                   });

    let google_analytics;
    const google_analytics_identifier = __GA_IDENTIFIER__
    let enable_google_analytics = false;

    $:{
        let prev_enable_google_analytics = enable_google_analytics;

        if($cookies_allow_analytics === 'true')
            enable_google_analytics = true;
        else
            enable_google_analytics = false;

        if(!prev_enable_google_analytics && prev_enable_google_analytics != enable_google_analytics && google_analytics)
            google_analytics.init();
    }

</script>

<GoogleAnalytics 
    bind:this={google_analytics}
    properties={[ google_analytics_identifier ]}
    enabled={enable_google_analytics}/>

<AuthorizedView optionalGuestMode automaticallyRefreshTokens={true}>
    <Router
        routes = {{
            '/' : Main,
            '/contact': Contact,
            '/privacy-policy': PrivacyPolicy,
            '/terms-and-conditions': TermsAndConditions,
            
            '/tasklist':    AppView,
            '/tasklist/*':  AppView,
            '/task' :       AppView,
            '/task/*' :     AppView,
            '/note' :       AppView,
            '/note/*' :     AppView,
            '/listboard' :  AppView,
            '/listboard/*': AppView,
            '/mytasks' :    AppView,
            '/mytasks/*' :  AppView,
            '/folder'    :  AppView,
            '/folder/*'  :  AppView,
            '/myfolders' :  AppView,
            '/myfolders/*': AppView,
            '/members'   :  AppView,

            '*': NotFound
        }} 
    />
    <Cookies/>
</AuthorizedView>
