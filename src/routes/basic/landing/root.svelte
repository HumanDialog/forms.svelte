<script>
    import Router from 'svelte-spa-router'
    import Landing from './landing.svelte' 
    import Contact from './contact.svelte';
    import PrivacyPolicy from './privacy.policy.svelte'
    import TermsAndConditions from './terms.and.conditions.svelte'
    import NotFound from './not.found.svelte'
</script>

<Router
        routes = {{
            '/': Landing,
            '/contact': Contact,
            '/privacy-policy': PrivacyPolicy,
            '/terms-and-conditions': TermsAndConditions,
            '*': NotFound
        }}
/>
