<script lang="ts">
  import { appName } from '$lib/app';
  import { purposeFrom } from '$lib/prd';
  import prd from '../../docs/PRD.md?raw';

  const purpose = purposeFrom(prd);
</script>

<svelte:head>
  <title>{appName}</title>
  <meta name="description" content={purpose} />
</svelte:head>

<main class="mx-auto w-full max-w-3xl px-4 py-12 sm:px-8">
  <h1 class="text-3xl font-bold">{appName}</h1>
  <p class="mt-4 text-lg">{purpose}</p>

  <details class="mt-10 rounded-lg border border-line bg-surface">
    <summary
      class="flex min-h-control cursor-pointer items-center px-4 font-semibold"
    >
      Read the whole plan (docs/PRD.md)
    </summary>
    <pre
      class="border-t border-line px-4 py-4 font-sans whitespace-pre-wrap">{prd}</pre>
  </details>
</main>
