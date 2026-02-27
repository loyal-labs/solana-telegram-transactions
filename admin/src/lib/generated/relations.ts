import { relations } from "drizzle-orm/relations";
import { communities, summaries, communityMembers, users, messages, businessConnections, botThreads, botMessages, summaryVotes } from "./schema";

export const summariesRelations = relations(summaries, ({one, many}) => ({
	community: one(communities, {
		fields: [summaries.communityId],
		references: [communities.id]
	}),
	summaryVotes: many(summaryVotes),
}));

export const communitiesRelations = relations(communities, ({many}) => ({
	summaries: many(summaries),
	communityMembers: many(communityMembers),
	messages: many(messages),
}));

export const communityMembersRelations = relations(communityMembers, ({one}) => ({
	community: one(communities, {
		fields: [communityMembers.communityId],
		references: [communities.id]
	}),
	user: one(users, {
		fields: [communityMembers.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	communityMembers: many(communityMembers),
	messages: many(messages),
	businessConnections: many(businessConnections),
	botThreads: many(botThreads),
	summaryVotes: many(summaryVotes),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	community: one(communities, {
		fields: [messages.communityId],
		references: [communities.id]
	}),
	user: one(users, {
		fields: [messages.userId],
		references: [users.id]
	}),
}));

export const businessConnectionsRelations = relations(businessConnections, ({one}) => ({
	user: one(users, {
		fields: [businessConnections.userId],
		references: [users.id]
	}),
}));

export const botThreadsRelations = relations(botThreads, ({one, many}) => ({
	user: one(users, {
		fields: [botThreads.userId],
		references: [users.id]
	}),
	botMessages: many(botMessages),
}));

export const botMessagesRelations = relations(botMessages, ({one}) => ({
	botThread: one(botThreads, {
		fields: [botMessages.threadId],
		references: [botThreads.id]
	}),
}));

export const summaryVotesRelations = relations(summaryVotes, ({one}) => ({
	user: one(users, {
		fields: [summaryVotes.userId],
		references: [users.id]
	}),
	summary: one(summaries, {
		fields: [summaryVotes.summaryId],
		references: [summaries.id]
	}),
}));