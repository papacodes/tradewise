-- Add exit_reason field to trades table
ALTER TABLE trades ADD COLUMN exit_reason TEXT CHECK (exit_reason IN ('take_profit', 'stop_loss', 'manual_exit'));

-- Set default value for existing trades based on current is_profitable field
-- This is a one-time migration to handle existing data
UPDATE trades SET exit_reason = CASE 
    WHEN is_profitable = true THEN 'take_profit'
    WHEN is_profitable = false THEN 'stop_loss'
    ELSE 'manual_exit'
END;

-- Make exit_reason NOT NULL after setting default values
ALTER TABLE trades ALTER COLUMN exit_reason SET NOT NULL;

-- Add index for better query performance
CREATE INDEX idx_trades_exit_reason ON trades(exit_reason);