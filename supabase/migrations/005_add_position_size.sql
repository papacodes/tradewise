-- Add position_size column to trades table
ALTER TABLE trades ADD COLUMN position_size DECIMAL(15,4) DEFAULT 1.0;

-- Add comment to explain the field
COMMENT ON COLUMN trades.position_size IS 'Position size in lots or units for P&L calculation';