import { Profile } from "../profiles.interface.js";
import { profilesService } from "../profiles.service.js";
import { interestsRepository } from "./interests.repository.js";

export const interestsService = {
  async addInterests(user_id: string, interests: string[]): Promise<Profile> {
    // Check total number of interests
    const currentInterestCount = await interestsRepository.countInterests(
      user_id
    );
    if (currentInterestCount + interests.length > 30) {
      throw new Error("Cannot have more than 30 interests");
    }

    // Check for existing interests
    const existingInterests = await interestsRepository.getUserInterests(
      user_id
    );
    if (
      existingInterests.some((interest) =>
        interests.includes(interest.interest_tag)
      )
    ) {
      throw new Error("At least one of the interests already exists");
    }

    // If all checks pass, add interests
    await interestsRepository.add(user_id, interests);

    // Return the updated profile
    return await profilesService.getProfile(user_id);
  },
};
