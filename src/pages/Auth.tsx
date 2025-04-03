
// This is a wrapper to maintain the original Auth.tsx file
// We're not modifying the actual content as it's marked read-only
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import OriginalAuth from "./Auth.original";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const invitationEmail = searchParams.get("email");
  const isInvitation = searchParams.get("invitation");

  useEffect(() => {
    // This is where we would modify the behavior for handling invitations
    // For now, we'll just log that we received an invitation
    if (invitationEmail && isInvitation) {
      console.log("User arriving from invitation with email:", invitationEmail);
    }
  }, [invitationEmail, isInvitation]);

  return <OriginalAuth />;
};

export default Auth;
