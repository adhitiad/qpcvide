import { prisma } from "./db.server";

export async function trainModel() {
  console.log("[Recommender] Starting model training...");

  // 1. Fetch all user events (watches)
  const events = await prisma.userEvent.findMany({
    where: { action: "watch" },
    select: { fingerprint: true, videoId: true },
  });

  if (events.length === 0) {
    console.log("[Recommender] No events found, skipping training.");
    return;
  }

  // 2. Build user-item matrix
  // userVideos: fingerprint -> Set<videoId>
  const userVideos = new Map<string, Set<string>>();
  for (const event of events) {
    if (!userVideos.has(event.fingerprint)) {
      userVideos.set(event.fingerprint, new Set());
    }
    userVideos.get(event.fingerprint)!.add(event.videoId);
  }

  const allFingerprints = Array.from(userVideos.keys());

  // 3. Calculate Recommendations
  // We will clear the old recommendations and insert new ones
  await prisma.videoRecommendation.deleteMany();

  const newRecommendations: any[] = [];

  for (const targetUser of allFingerprints) {
    const targetSet = userVideos.get(targetUser)!;
    
    // Calculate similarities with other users
    const similarities = new Map<string, number>(); // otherUser -> similarity
    
    for (const otherUser of allFingerprints) {
      if (targetUser === otherUser) continue;
      
      const otherSet = userVideos.get(otherUser)!;
      
      // Jaccard similarity: intersection / union
      let intersection = 0;
      for (const vid of targetSet) {
        if (otherSet.has(vid)) intersection++;
      }
      
      if (intersection === 0) continue;
      
      const union = targetSet.size + otherSet.size - intersection;
      const similarity = intersection / union;
      similarities.set(otherUser, similarity);
    }

    // Find candidate videos (watched by similar users, not watched by target)
    // Map of videoId -> accumulated score
    const candidateScores = new Map<string, number>();

    for (const [otherUser, simScore] of similarities.entries()) {
      const otherSet = userVideos.get(otherUser)!;
      for (const vid of otherSet) {
        if (!targetSet.has(vid)) {
          const currentScore = candidateScores.get(vid) || 0;
          candidateScores.set(vid, currentScore + simScore);
        }
      }
    }

    // Get top 10 recommendations for this user
    const topRecommendations = Array.from(candidateScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    for (const [videoId, score] of topRecommendations) {
      newRecommendations.push({
        fingerprint: targetUser,
        videoId,
        score,
      });
    }
  }

  // 4. Save to database
  if (newRecommendations.length > 0) {
    await prisma.videoRecommendation.createMany({
      data: newRecommendations,
      skipDuplicates: true,
    });
  }

  console.log(`[Recommender] Training completed. Generated ${newRecommendations.length} recommendations.`);
}
