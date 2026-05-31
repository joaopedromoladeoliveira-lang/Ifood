/*
  # Add increment_balance function

  This migration adds a helper function to increment user balances safely.
  This is used by edge functions to update restaurant and driver earnings.
*/

CREATE OR REPLACE FUNCTION increment_balance(
  p_user_id uuid,
  p_amount decimal(10,2)
)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
