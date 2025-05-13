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
	import {appUsers} from './users.js'

	const mode = __APP_MODE__
    const objectreef_io = __OBJECTREEF_IO__
    const appId = __APP_ID__
    const tenantId = __TENANT_ID__
    const proto = __SERVICE_PROTOCOL__
    const clientID = __CLIENT_ID__
    const clientSecret = __CLIENT_SECRET__
    const website = __WEBSITE__
    const octopus_modules = __OCTOPUS_MODULES__

    
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
                        users: appUsers,
                        apiVersion: "v001"}
                   });

    const r = /^\/listboard|tasklist|task|note|folder|mytasks|myfolders|members|chat|thread|newthread|forum|tiloshome|request-license-file\/(.*)\/?$/i

    const routes = new Map()
    routes.set('/',                     Main)
    routes.set('/contact',              Contact)
    routes.set('/privacy-policy',       PrivacyPolicy)
    routes.set('/terms-and-conditions', TermsAndConditions)
    routes.set(r, AppView)
    routes.set('*', NotFound)

</script>

<svelte:head>
    <link rel="icon" type="image/png" href={__APP_ICON__} />
</svelte:head>

<AuthorizedView optionalGuestMode automaticallyRefreshTokens={true}>
    <Router {routes} />
    <Cookies/>
</AuthorizedView>
