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

    
    
	const mode = 'local'
    const objectreef_io = 'localhost:1996'
    const appId = 'octopus'
    const tenantId = 'octopus'
    const proto = 'http'
    const clientID = 'SampleClientId'
    const clientSecret = 'SampleClientSecret'
    const website = 'http://localhost:5173'

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
</script>

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
