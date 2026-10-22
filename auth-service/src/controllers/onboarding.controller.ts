import { Request, Response } from 'express';
import { onboardingSchema } from '../schemas/onboarding.schema';
import { db } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get random workspace color from CustomColors enum
const getRandomWorkspaceColor = (): string => {
  const colors = [
    'PURPLE', 'RED', 'GREEN', 'BLUE', 'PINK',
    'YELLOW', 'ORANGE', 'CYAN', 'LIME', 'EMERALD',
    'INDIGO', 'FUCHSIA'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const completeOnboarding = async (req: Request, res: Response) => {
  try {
    console.log('\n🔷🔷🔷 ONBOARDING CONTROLLER START 🔷🔷🔷');

    // Extract user ID from token/session
    // For now, expect it in the body or headers
    const userId = req.body.userId || req.headers['x-user-id'];
    console.log(`👤 User ID: ${userId}`);

    if (!userId) {
      console.log('❌ No user ID provided');
      return res.status(401).json({ error: 'Unauthorized: User ID required' });
    }

    const body = req.body;
    console.log('📝 Validating onboarding data...');
    const result = onboardingSchema.safeParse(body);

    if (!result.success) {
      console.log('❌ Validation failed:', result.error.issues);
      return res.status(400).json({
        error: 'ERRORS.WRONG_DATA',
        details: result.error.issues
      });
    }
    console.log('✅ Validation passed');

    const {
      useCase,
      workspaceName,
      name,
      surname,
      workspaceImage,
      leetcodeUsername,
      codeforcesUsername,
      codechefUsername,
      githubUsername,
      redditUsername,
    } = result.data;

    console.log(`  📋 Name: ${name} ${surname}`);
    console.log(`  🏢 Workspace: ${workspaceName}`);
    console.log(`  💼 Use Case: ${useCase}`);

    // Check if user exists
    console.log('🔍 Checking if user exists in database...');
    const user = await db.user.findUnique({
      where: { id: userId as string },
    });

    if (!user) {
      console.log('❌ User not found');
      return res.status(404).json({
        error: 'ERRORS.NO_USER_API',
        message: 'User not found'
      });
    }
    console.log(`✅ User found: ${user.email}`);

    // Update user with onboarding data
    console.log('💾 Updating user profile with onboarding data...');
    await db.user.update({
      where: { id: userId as string },
      data: {
        completedOnboarding: true,
        name,
        surname,
        ...(useCase ? { useCase: useCase as any } : {}),
      },
    });
    console.log('✅ User profile updated');

    // Create workspace
    const workspaceColor = getRandomWorkspaceColor();
    console.log(`🎨 Creating workspace with color: ${workspaceColor}`);
    const workspace = await db.workspace.create({
      data: {
        creatorId: user.id,
        name: workspaceName,
        image: workspaceImage,
        inviteCode: uuidv4(),
        adminCode: uuidv4(),
        canEditCode: uuidv4(),
        readOnlyCode: uuidv4(),
        color: workspaceColor as any, // Cast to any to avoid enum type issues
      },
    });
    console.log(`✅ Workspace created: ${workspace.id}`);

    // Create subscription
    console.log('📋 Creating subscription (OWNER role)...');
    await db.subscription.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        userRole: 'OWNER',
      },
    });

    await db.channel.create({
      data: {
        name: 'general',
        type: 'TEXT',
        workspaceId: workspace.id,
      },
    });
    console.log('✅ Subscription and default channel created');

    // Create pomodoro settings
    console.log('⏱️ Creating pomodoro settings...');
    await db.pomodoroSettings.create({
      data: {
        userId: user.id,
      },
    });
    console.log('✅ Pomodoro settings created');

    // TODO: Store external service usernames if needed
    // This could be stored in a separate ExternalProfiles table
    if (leetcodeUsername || codeforcesUsername || codechefUsername || githubUsername || redditUsername) {
      console.log('📌 External service usernames provided:');
      if (leetcodeUsername) console.log(`  - LeetCode: ${leetcodeUsername}`);
      if (codeforcesUsername) console.log(`  - Codeforces: ${codeforcesUsername}`);
      if (codechefUsername) console.log(`  - CodeChef: ${codechefUsername}`);
      if (githubUsername) console.log(`  - GitHub: ${githubUsername}`);
      if (redditUsername) console.log(`  - Reddit: ${redditUsername}`);
    }

    console.log('🎉 Onboarding completed successfully!');
    console.log('🔷🔷🔷 ONBOARDING CONTROLLER END (SUCCESS) 🔷🔷🔷\n');

    res.status(200).json({
      message: 'Onboarding completed successfully',
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
    });
  } catch (error) {
    console.error('❌❌❌ Onboarding error:', error);
    console.log('🔷🔷🔷 ONBOARDING CONTROLLER END (ERROR) 🔷🔷🔷\n');
    res.status(500).json({ error: 'Something went wrong during onboarding' });
  }
};
