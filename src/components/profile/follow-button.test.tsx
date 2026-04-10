import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FollowButton } from "./follow-button";
import { createWrapper } from "@/test/wrappers";

const mockMutate = vi.fn();

vi.mock("@/hooks/use-follows", () => ({
  useIsFollowing: vi.fn(),
  useFollow: vi.fn(() => ({ mutate: mockMutate })),
}));

// Import after mock so we can control return values
import { useIsFollowing } from "@/hooks/use-follows";
const mockUseIsFollowing = vi.mocked(useIsFollowing);

beforeEach(() => {
  vi.clearAllMocks();
  mockUseIsFollowing.mockReturnValue({
    data: false,
    isLoading: false,
    isSuccess: true,
  } as ReturnType<typeof useIsFollowing>);
});

describe("FollowButton", () => {
  it("renders nothing when viewing own profile", () => {
    const { container } = render(<FollowButton targetUserId="user-123" />, {
      wrapper: createWrapper(),
    });

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when not authenticated", () => {
    const { container } = render(<FollowButton targetUserId="other-user" />, {
      wrapper: createWrapper({ user: null, profile: null, effectiveProfileId: undefined }),
    });

    expect(container.firstChild).toBeNull();
  });

  it("shows loading spinner while follow state loads", () => {
    mockUseIsFollowing.mockReturnValue({
      data: undefined,
      isLoading: true,
      isSuccess: false,
    } as ReturnType<typeof useIsFollowing>);

    render(<FollowButton targetUserId="other-user" />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it('shows "Seguir" when not following', () => {
    mockUseIsFollowing.mockReturnValue({
      data: false,
      isLoading: false,
      isSuccess: true,
    } as ReturnType<typeof useIsFollowing>);

    render(<FollowButton targetUserId="other-user" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Seguir")).toBeInTheDocument();
  });

  it('shows "Siguiendo" when following', () => {
    mockUseIsFollowing.mockReturnValue({
      data: true,
      isLoading: false,
      isSuccess: true,
    } as ReturnType<typeof useIsFollowing>);

    render(<FollowButton targetUserId="other-user" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText("Siguiendo")).toBeInTheDocument();
  });

  it('shows "Dejar de seguir" on hover when following', async () => {
    const user = userEvent.setup();

    mockUseIsFollowing.mockReturnValue({
      data: true,
      isLoading: false,
      isSuccess: true,
    } as ReturnType<typeof useIsFollowing>);

    render(<FollowButton targetUserId="other-user" />, {
      wrapper: createWrapper(),
    });

    const button = screen.getByRole("button");
    await user.hover(button);

    expect(screen.getByText("Dejar de seguir")).toBeInTheDocument();
  });

  it("calls mutate with correct args on click", async () => {
    const user = userEvent.setup();

    mockUseIsFollowing.mockReturnValue({
      data: false,
      isLoading: false,
      isSuccess: true,
    } as ReturnType<typeof useIsFollowing>);

    render(<FollowButton targetUserId="other-user" />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByRole("button"));

    expect(mockMutate).toHaveBeenCalledWith({
      targetUserId: "other-user",
      isFollowing: false,
    });
  });

  it("calls mutate with isFollowing: true when unfollowing", async () => {
    const user = userEvent.setup();

    mockUseIsFollowing.mockReturnValue({
      data: true,
      isLoading: false,
      isSuccess: true,
    } as ReturnType<typeof useIsFollowing>);

    render(<FollowButton targetUserId="other-user" />, {
      wrapper: createWrapper(),
    });

    await user.click(screen.getByRole("button"));

    expect(mockMutate).toHaveBeenCalledWith({
      targetUserId: "other-user",
      isFollowing: true,
    });
  });
});
