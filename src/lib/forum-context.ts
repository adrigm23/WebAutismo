import { getDb } from "@/lib/prisma";

export type ThreadContext = {
  threadId: string;
  threadTitle: string;
  threadType: "DISCUSSION" | "ANNOUNCEMENT";
  categorySlug: string;
  categoryTitle: string;
  courseSlug: string;
  forumSpaceId: string | null;
  threadAuthorId: string;
  threadAuthorName: string;
};

export type PostContext = ThreadContext & {
  postId: string;
  postAuthorId: string;
  postAuthorName: string;
};

export async function getThreadContext(threadId: string) {
  return (await getDb().forumThread.findUnique({
    where: {
      id: threadId
    },
    include: {
      author: {
        select: {
          id: true,
          name: true
        }
      },
      category: {
        select: {
          slug: true,
          title: true,
          courseSlug: true,
          forumSpaceId: true
        }
      }
    }
  })) as
    | {
        id: string;
        title: string;
        type: "DISCUSSION" | "ANNOUNCEMENT";
        author: {
          id: string;
          name: string;
        };
        category: {
          slug: string;
          title: string;
          courseSlug: string;
          forumSpaceId: string | null;
        };
      }
    | null;
}

export async function getPostContext(postId: string) {
  return (await getDb().forumPost.findUnique({
    where: {
      id: postId
    },
    include: {
      author: {
        select: {
          id: true,
          name: true
        }
      },
      thread: {
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          },
          category: {
            select: {
              slug: true,
              title: true,
              courseSlug: true,
              forumSpaceId: true
            }
          }
        }
      }
    }
  })) as
    | {
        id: string;
        author: {
          id: string;
          name: string;
        };
        thread: {
          id: string;
          title: string;
          type: "DISCUSSION" | "ANNOUNCEMENT";
          author: {
            id: string;
            name: string;
          };
          category: {
            slug: string;
            title: string;
            courseSlug: string;
            forumSpaceId: string | null;
          };
        };
      }
    | null;
}

export async function getReportContext(reportId: string) {
  return (await getDb().forumReport.findUnique({
    where: {
      id: reportId
    },
    include: {
      thread: {
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          },
          category: {
            select: {
              slug: true,
              title: true,
              courseSlug: true,
              forumSpaceId: true
            }
          }
        }
      },
      post: {
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          },
          thread: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true
                }
              },
              category: {
                select: {
                  slug: true,
                  title: true,
                  courseSlug: true,
                  forumSpaceId: true
                }
              }
            }
          }
        }
      }
    }
  })) as
    | {
        id: string;
        reason: string;
        reportedById: string;
        thread: {
          id: string;
          title: string;
          author: {
            id: string;
            name: string;
          };
          category: {
            slug: string;
            title: string;
            courseSlug: string;
            forumSpaceId: string | null;
          };
        } | null;
        post:
          | {
              id: string;
              author: {
                id: string;
                name: string;
              };
              thread: {
                id: string;
                title: string;
                author: {
                  id: string;
                  name: string;
                };
                category: {
                  slug: string;
                  title: string;
                  courseSlug: string;
                  forumSpaceId: string | null;
                };
              };
            }
          | null;
      }
    | null;
}

export async function getAttachmentContext(attachmentId: string) {
  return (await getDb().forumAttachment.findUnique({
    where: {
      id: attachmentId
    },
    include: {
      thread: {
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          },
          category: {
            select: {
              slug: true,
              title: true,
              courseSlug: true,
              forumSpaceId: true
            }
          }
        }
      },
      post: {
        include: {
          author: {
            select: {
              id: true,
              name: true
            }
          },
          thread: {
            include: {
              category: {
                select: {
                  slug: true,
                  title: true,
                  courseSlug: true,
                  forumSpaceId: true
                }
              }
            }
          }
        }
      }
    }
  })) as
    | {
        id: string;
        label: string;
        url: string;
        storageKey: string | null;
        thread:
          | {
              id: string;
              title: string;
              createdAt: Date;
              deletedAt: Date | null;
              author: {
                id: string;
                name: string;
              };
              category: {
                slug: string;
                title: string;
                courseSlug: string;
                forumSpaceId: string | null;
              };
            }
          | null;
        post:
          | {
              id: string;
              createdAt: Date;
              deletedAt: Date | null;
              author: {
                id: string;
                name: string;
              };
              thread: {
                id: string;
                title: string;
                category: {
                  slug: string;
                  title: string;
                  courseSlug: string;
                  forumSpaceId: string | null;
                };
              };
            }
          | null;
      }
    | null;
}

export function toThreadContext(
  record: NonNullable<Awaited<ReturnType<typeof getThreadContext>>>
): ThreadContext {
  return {
    threadId: record.id,
    threadTitle: record.title,
    threadType: record.type,
    categorySlug: record.category.slug,
    categoryTitle: record.category.title,
    courseSlug: record.category.courseSlug,
    forumSpaceId: record.category.forumSpaceId,
    threadAuthorId: record.author.id,
    threadAuthorName: record.author.name
  };
}

export function toPostContext(
  record: NonNullable<Awaited<ReturnType<typeof getPostContext>>>
): PostContext {
  return {
    threadId: record.thread.id,
    threadTitle: record.thread.title,
    threadType: record.thread.type,
    categorySlug: record.thread.category.slug,
    categoryTitle: record.thread.category.title,
    courseSlug: record.thread.category.courseSlug,
    forumSpaceId: record.thread.category.forumSpaceId,
    threadAuthorId: record.thread.author.id,
    threadAuthorName: record.thread.author.name,
    postId: record.id,
    postAuthorId: record.author.id,
    postAuthorName: record.author.name
  };
}
