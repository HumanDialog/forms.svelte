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
	import { onMount } from 'svelte';

    
    
	const mode = 'local'
    const objectreef_io = 'localhost:1996'
    const appId = 'octopus'
    const tenantId = 'octopus'
    const proto = 'http'
    const clientID = 'SampleClientId'
    const clientSecret = 'SampleClientSecret'
    const website = 'http://localhost:5173'

    console.log('App init')
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
                            },
                            {
                                username: "aga@humandialog.com.pl",
                                role: 'GroupOwner',
                                groupId: 1
                            }
                        ],
                        apiVersion: "v001"}
                   });

    const r = /^\/listboard|tasklist|task|note|folder|mytasks|myfolders|members|chat\/(.*)\/?$/i

    const routes = new Map()
    routes.set('/',                     Main)
    routes.set('/contact',              Contact)
    routes.set('/privacy-policy',       PrivacyPolicy)
    routes.set('/terms-and-conditions', TermsAndConditions)
    routes.set(r, AppView)
    routes.set('*', NotFound)

</script>

<AuthorizedView optionalGuestMode automaticallyRefreshTokens={true}>
    <Router {routes} />
    <Cookies/>
</AuthorizedView>
