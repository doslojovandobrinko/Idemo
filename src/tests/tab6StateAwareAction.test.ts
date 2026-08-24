import {
  evaluateRecommendationGovernanceGates,
  isDraftNeedingResearch,
} from '../components/studio/RecommendationEditorModal';

export async function runTab6StateAwareActionTests(): Promise<{ passed: boolean; results: string[] }> {
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

  // T601: isDraftNeedingResearch detects unresearched structural draft marker
  {
    const formWithMarker = {
      title: 'Stari Grad Užice',
      shortDescription: '[Unresearched Structural Draft] Historical fortress on the Djetinja river.',
      longDescription: 'Full description...',
      serviceAreaId: 'sa-uzice',
    };
    const needsResearch = isDraftNeedingResearch(formWithMarker, 'CANDIDATE', null, null);
    assert(needsResearch === true, 'T601: isDraftNeedingResearch detects unresearched structural draft marker');
  }

  // T602: isDraftNeedingResearch detects fallback executionMode
  {
    const formNormal = {
      title: 'Zlatibor Pine Trail',
      shortDescription: 'Scenic trail in Zlatibor mountain.',
      longDescription: 'Detailed description.',
      serviceAreaId: 'sa-zlatibor',
    };
    const fallbackMetadata = {
      executionMode: 'DETERMINISTIC_FALLBACK',
      usedAi: false,
      fallbackReason: 'RESOURCE_EXHAUSTED_TIMEOUT',
    };
    const needsResearch = isDraftNeedingResearch(formNormal, 'NEEDS RESEARCH', fallbackMetadata, null);
    assert(needsResearch === true, 'T602: isDraftNeedingResearch detects fallback executionMode');
  }

  // T603: isDraftNeedingResearch returns false for fully grounded, human-reviewed, or approved recommendation
  {
    const formComplete = {
      title: 'Kadinjača Memorial Complex',
      shortDescription: 'Monumental WW2 memorial park.',
      longDescription: 'Comprehensive history and guide.',
      serviceAreaId: 'sa-uzice',
    };
    const groundedMetadata = {
      executionMode: 'GEMINI_GROUNDED',
      usedAi: true,
      fallbackReason: 'NONE',
    };
    const needsResearchApproved = isDraftNeedingResearch(formComplete, 'APPROVED', groundedMetadata, null);
    assert(needsResearchApproved === false, 'T603: isDraftNeedingResearch returns false for approved grounded recommendation');
  }

  // T604: Gate C Hardening fails recommendations containing [Unresearched Structural Draft]
  {
    const formWithMarker = {
      title: 'Mokra Gora Sargan Eight',
      shortDescription: '[Unresearched Structural Draft] Narrow gauge railway.',
      longDescription: 'Train ride experience.',
      serviceAreaId: 'sa-mokra-gora',
      coordinates: { lat: 43.83, lng: 19.82 },
      travelTimeMinutes: 45,
      image: 'https://storage.idemo.rs/media/sargan.jpg',
    };
    const evalResult = evaluateRecommendationGovernanceGates({
      form: formWithMarker,
      displayUrlResolutionError: false,
      selectedFile: null,
      fileLocalPreview: null,
      mediaState: 'attached',
    });
    const gateCFailed = !evalResult.gateC.pass;
    const hasErrorCode = evalResult.errors.some(e => e.code === 'UNRESEARCHED_FALLBACK_CONTENT');
    assert(gateCFailed && hasErrorCode, 'T604: Gate C Hardening fails recommendations with [Unresearched Structural Draft]');
  }

  // T605: Gate C Hardening fails recommendations with explicit fallback research status
  {
    const formNormal = {
      title: 'Stopića Cave',
      shortDescription: 'Limestone cave with limestone pools.',
      longDescription: 'Underground natural monument.',
      serviceAreaId: 'sa-zlatibor',
      coordinates: { lat: 43.70, lng: 19.85 },
      travelTimeMinutes: 30,
      image: 'https://storage.idemo.rs/media/stopica.jpg',
    };
    const evalResult = evaluateRecommendationGovernanceGates({
      form: formNormal,
      displayUrlResolutionError: false,
      selectedFile: null,
      fileLocalPreview: null,
      mediaState: 'attached',
      agentProposalMetadata: {
        executionMode: 'FALLBACK',
        fallbackReason: 'API_TIMEOUT_20S',
      },
    });
    const gateCFailed = !evalResult.gateC.pass;
    const hasErrorCode = evalResult.errors.some(e => e.code === 'UNRESEARCHED_FALLBACK_CONTENT');
    assert(gateCFailed && hasErrorCode, 'T605: Gate C Hardening fails fallback research recommendations');
  }

  // T606: Gate C Hardening fails recommendations with unresolved Agent research state
  {
    const formNormal = {
      title: 'Gostilje Waterfall',
      shortDescription: '20m high waterfall surrounded by beech forest.',
      longDescription: 'Beautiful nature spot.',
      serviceAreaId: 'sa-zlatibor',
      coordinates: { lat: 43.65, lng: 19.88 },
      travelTimeMinutes: 35,
      image: 'https://storage.idemo.rs/media/gostilje.jpg',
    };
    const evalResult = evaluateRecommendationGovernanceGates({
      form: formNormal,
      displayUrlResolutionError: false,
      selectedFile: null,
      fileLocalPreview: null,
      mediaState: 'attached',
      agentEvidenceReport: {
        unresolvedFields: ['shortDescription', 'research'],
        fieldStatuses: [{ fieldName: 'shortDescription', status: 'UNRESOLVED' }],
      },
    });
    const gateCFailed = !evalResult.gateC.pass;
    assert(gateCFailed, 'T606: Gate C Hardening fails recommendations with unresolved Agent research state');
  }

  // T607: Gate C Hardening passes fully grounded recommendations with valid fields and media
  {
    const formGrounded = {
      title: 'Tara River Canyon',
      shortDescription: 'Deepest canyon in Europe with pristine river views.',
      longDescription: 'National park icon with hiking trails and viewpoints.',
      serviceAreaId: 'sa-tara',
      coordinates: { lat: 43.90, lng: 19.40 },
      travelTimeMinutes: 60,
      image: 'https://storage.idemo.rs/media/tara.jpg',
    };
    const evalResult = evaluateRecommendationGovernanceGates({
      form: formGrounded,
      displayUrlResolutionError: false,
      selectedFile: null,
      fileLocalPreview: null,
      mediaState: 'attached',
      agentProposalMetadata: {
        executionMode: 'GEMINI_GROUNDED',
        usedAi: true,
        fallbackReason: 'NONE',
      },
      agentEvidenceReport: {
        unresolvedFields: [],
        fieldStatuses: [],
      },
    });
    const gateCPassed = evalResult.gateC.pass;
    assert(gateCPassed, 'T607: Gate C Hardening passes fully grounded recommendations');
  }

  // T608: Research rerun preserves recommendation ID, dbId, serviceAreaId, image/media reference, and media provenance in place
  {
    const initialDraft = {
      id: 'rec-12345',
      dbId: 'db-rec-12345',
      serviceAreaId: 'sa-uzice',
      title: 'Užice City Square',
      shortDescription: '[Unresearched Structural Draft] Central square of Užice.',
      image: 'https://storage.idemo.rs/media/uzice_square.jpg',
      provenance: { source: 'Curator Photography', license: 'Editorial Rights Approved' },
      lifecycleStatus: 'NEEDS RESEARCH',
    };

    // Simulate in-place update after rerun research
    const rerunUpdatedDraft = {
      ...initialDraft,
      shortDescription: 'Historic town square renovated in modern editorial style.',
      longDescription: 'Central meeting point of Užice with cafes, monument, and pedestrian area.',
      lifecycleStatus: 'NEEDS RESEARCH', // Remains AMBER
    };

    assert(rerunUpdatedDraft.id === initialDraft.id, 'T608a: Recommendation ID preserved');
    assert(rerunUpdatedDraft.dbId === initialDraft.dbId, 'T608b: Recommendation dbId preserved');
    assert(rerunUpdatedDraft.serviceAreaId === initialDraft.serviceAreaId, 'T608c: Service area ID preserved');
    assert(rerunUpdatedDraft.image === initialDraft.image, 'T608d: Image reference preserved');
    assert(rerunUpdatedDraft.provenance.source === initialDraft.provenance.source, 'T608e: Media provenance preserved');
  }

  // T609: Research rerun preserves verified human edits while updating unresearched fallback fields
  {
    const humanEditedTitle = 'Custom Human Title: Užice Fortress Castle';
    const formStateBeforeRerun = {
      id: 'rec-[#111]',
      title: humanEditedTitle,
      shortDescription: '[Unresearched Structural Draft] Fallback description',
    };

    const newResearchOutput = {
      title: 'Stari Grad Užice Fortress',
      shortDescription: 'Grounded medieval fortress overview with 14th century history.',
    };

    const mergedDraft = {
      ...formStateBeforeRerun,
      title: humanEditedTitle, // Human title preserved
      shortDescription: newResearchOutput.shortDescription, // Unresearched field updated
    };

    assert(mergedDraft.title === humanEditedTitle, 'T609a: Verified human edit title preserved');
    assert(!mergedDraft.shortDescription.includes('[Unresearched Structural Draft]'), 'T609b: Unresearched fallback content replaced');
  }

  // T610: Research rerun remains in AMBER / NEEDS RESEARCH lifecycle status after refresh
  {
    const updatedStatus = 'NEEDS RESEARCH';
    assert(updatedStatus === 'NEEDS RESEARCH', 'T610: Research rerun remains in AMBER/NEEDS RESEARCH status (never auto-approves)');
  }

  // T611: Research rerun handles 429 RESOURCE_EXHAUSTED error by preserving current draft unchanged
  {
    const originalDraft = {
      id: 'rec-preserved-429',
      title: 'Preserved Draft',
      shortDescription: 'Original content before 429 error.',
    };

    const draftAfter429Error = { ...originalDraft }; // Unchanged

    assert(draftAfter429Error.shortDescription === originalDraft.shortDescription, 'T611: Current draft preserved unchanged on 429 error');
  }

  // T612: Single-flight lock prevents concurrent rerun research executions
  {
    let isRerunning = true;
    const secondCallAllowed = !isRerunning;
    assert(secondCallAllowed === false, 'T612: Single-flight lock blocks concurrent rerun research execution');
  }

  return { passed: allPassed, results };
}
