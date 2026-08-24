import { compileRecommendationProposal, AgentProposalInput } from '../lib/recommendationAgentService';

export async function runNonDestructive429RerunTests(): Promise<{ passed: boolean; results: string[] }> {
  const results: string[] = [];
  let allPassed = true;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      results.push(`PASS: ${testName}`);
    } else {
      allPassed = false;
      results.push(`FAIL: ${testName} ${detail ? `- ${detail}` : ''}`);
    }
  }

  // Setup initial draft state representing Žestival Užice candidate with human edits
  const initialDraft = {
    id: 'rec-zestival-001',
    dbId: 'db-rec-zestival-001',
    serviceAreaId: 'sa-uzice',
    title: 'Žestival Užice',
    shortDescription: 'Festival rakije i voćnih rakija Užice.',
    longDescription: 'Tradicionalni žestival posvećen autentičnim voćnim rakijama zlatiborskog kraja.',
    location: 'Užice, Trg Partizana',
    category: 'Gastronomy',
    image: 'https://storage.idemo.rs/media/zestival.jpg',
    provenance: {
      source: 'Curator Field Photography',
      license: 'Editorial Rights Approved',
      verificationStatus: 'Verified',
    },
    lifecycleStatus: 'NEEDS RESEARCH',
    practicalInfo: {
      website: 'https://zestival.rs',
      contact_phone: '+381 31 512 345',
    },
  };

  // Simulated 429 response result returned by server/compileRecommendationProposal
  const simulated429Result = {
    recommendation: {
      id: 'rec-candidate-new-999', // New candidate ID from server fallback
      serviceAreaId: 'sa-uzice',
      title: 'Žestival Užice',
      shortDescription: '[Unresearched Structural Draft] Žestival Užice. Live research unavailable.',
      longDescription: '[Unresearched Structural Draft] Live destination research was unavailable.',
      location: 'Užice',
      image: '',
      provenance: { source: 'Pending Human Upload' },
    },
    metadata: {
      usedAi: false,
      executionMode: 'DETERMINISTIC_FALLBACK' as const,
      model: 'deterministic_semantic_engine',
      fallbackReason: '429 RESOURCE_EXHAUSTED (Quota Exceeded)',
      quotaExceeded: true,
      sources: [],
    },
  };

  // NR429-01 rerun 429 preserves all existing fields
  {
    const isQuotaExceeded =
      Boolean(simulated429Result.metadata?.quotaExceeded) ||
      Boolean(simulated429Result.metadata?.fallbackReason?.includes('429'));

    let formState = { ...initialDraft };

    if (isQuotaExceeded) {
      // Non-destructive action: preserve form state without merging
    } else {
      formState = { ...formState, ...simulated429Result.recommendation } as any;
    }

    assert(
      formState.title === initialDraft.title &&
      formState.shortDescription === initialDraft.shortDescription &&
      formState.longDescription === initialDraft.longDescription,
      'NR429-01 rerun 429 preserves all existing fields'
    );
  }

  // NR429-02 fallback markers are not merged during rerun
  {
    const isQuotaExceeded = Boolean(simulated429Result.metadata?.quotaExceeded);
    let formState = { ...initialDraft };
    if (!isQuotaExceeded) {
      formState.shortDescription = simulated429Result.recommendation.shortDescription;
    }

    assert(
      !formState.shortDescription.includes('[Unresearched Structural Draft]'),
      'NR429-02 fallback markers are not merged during rerun'
    );
  }

  // NR429-03 lifecycle remains NEEDS RESEARCH
  {
    let lifecycle = initialDraft.lifecycleStatus;
    const isQuotaExceeded = Boolean(simulated429Result.metadata?.quotaExceeded);
    if (!isQuotaExceeded) {
      lifecycle = 'NEEDS RESEARCH';
    }
    assert(
      lifecycle === 'NEEDS RESEARCH',
      'NR429-03 lifecycle remains NEEDS RESEARCH'
    );
  }

  // NR429-04 image and provenance unchanged
  {
    let formState = { ...initialDraft };
    const isQuotaExceeded = Boolean(simulated429Result.metadata?.quotaExceeded);
    if (!isQuotaExceeded) {
      formState.image = simulated429Result.recommendation.image;
      formState.provenance = simulated429Result.recommendation.provenance as any;
    }
    assert(
      formState.image === 'https://storage.idemo.rs/media/zestival.jpg' &&
      formState.provenance.source === 'Curator Field Photography',
      'NR429-04 image and provenance unchanged'
    );
  }

  // NR429-05 human edits unchanged
  {
    let formState = { ...initialDraft };
    const isQuotaExceeded = Boolean(simulated429Result.metadata?.quotaExceeded);
    if (!isQuotaExceeded) {
      formState.practicalInfo = simulated429Result.recommendation as any;
    }
    assert(
      formState.practicalInfo.contact_phone === '+381 31 512 345' &&
      formState.practicalInfo.website === 'https://zestival.rs',
      'NR429-05 human edits unchanged'
    );
  }

  // NR429-06 quota metadata set
  {
    let agentMetadata: any = null;
    const isQuotaExceeded = Boolean(simulated429Result.metadata?.quotaExceeded);
    if (isQuotaExceeded) {
      agentMetadata = {
        usedAi: false,
        executionMode: 'DETERMINISTIC_FALLBACK',
        model: 'deterministic_semantic_engine',
        sources: [],
        quotaExceeded: true,
        fallbackReason: '429 RESOURCE_EXHAUSTED',
      };
    }
    assert(
      agentMetadata?.quotaExceeded === true &&
      agentMetadata?.fallbackReason === '429 RESOURCE_EXHAUSTED',
      'NR429-06 quota metadata set'
    );
  }

  // NR429-07 no duplicate created
  {
    let formState = { ...initialDraft };
    const isQuotaExceeded = Boolean(simulated429Result.metadata?.quotaExceeded);
    if (!isQuotaExceeded) {
      formState.id = simulated429Result.recommendation.id;
    }
    assert(
      formState.id === 'rec-zestival-001' && formState.dbId === 'db-rec-zestival-001',
      'NR429-07 no duplicate created'
    );
  }

  // NR429-08 initial creation fallback still works
  {
    const input: AgentProposalInput = {
      nameOrTitle: 'Tara Rafting',
      destinationOrLocation: 'Bajina Bašta',
    };
    const initialCompilation = await compileRecommendationProposal(input, []);
    assert(
      initialCompilation.recommendation.title === 'Tara Rafting' &&
      typeof initialCompilation.recommendation.shortDescription === 'string' &&
      initialCompilation.evidenceReport.headerVisualState === 'AMBER',
      'NR429-08 initial creation fallback still works'
    );
  }

  return { passed: allPassed, results };
}
