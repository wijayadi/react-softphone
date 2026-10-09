import React, { useEffect, useState, useRef } from 'react';

import {
  Typography,
  Box,
  AppBar,
  Tabs,
  Tab,
  Chip,
  Paper,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Phone as PhoneIcon } from '@phosphor-icons/react/dist/ssr/Phone';
import { PhoneOutgoing as PhoneOutgoingIcon } from '@phosphor-icons/react/dist/ssr/PhoneOutgoing';
import { PhoneIncoming as PhoneIncomingIcon } from '@phosphor-icons/react/dist/ssr/PhoneIncoming';
import { PhoneX as PhoneXIcon } from '@phosphor-icons/react/dist/ssr/PhoneX';
import { DeviceMobile as DeviceMobileIcon } from '@phosphor-icons/react/dist/ssr/DeviceMobile';
import { ArrowsClockwise as ArrowsClockwiseIcon } from '@phosphor-icons/react/dist/ssr/ArrowsClockwise';
import { PauseCircle as PauseCircleIcon } from '@phosphor-icons/react/dist/ssr/PauseCircle';
import { m, translateCallInfo } from '../i18n';
import type { SoftPhoneState } from '../types';

export interface SwipeCaruselBlockProps {
  localStatePhone: SoftPhoneState;
  activeChannel: number;
  setActiveChannel: (index: number) => void;
  /** Accepted for interface compatibility; not used by this block. */
  setLocalStatePhone?: (updater: unknown) => void;
  /**
   * When provided (e.g. from the shared store) durations are rendered from this
   * value instead of the block's internal ticker, so mirrored views stay in sync.
   */
  durations?: DurationState[];
}

type TabPanelProps = Omit<React.ComponentProps<typeof Typography>, 'children' | 'component' | 'ref'> & {
  children?: React.ReactNode | (() => React.ReactNode);
  value: number;
  index: number;
};

function TabPanel(props: TabPanelProps) {
  const {
    children, value, index, ...other
  } = props;

  return (
    <Typography
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{typeof children === 'function' ? children() : children}</Box>}
    </Typography>
  );
}

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

interface MuiSwipeableViewsProps {
  index: number;
  onChangeIndex?: (index: number) => void;
  children?: React.ReactNode;
  // Unused parameters prefixed with underscore to satisfy linting
  _animateHeight?: boolean;
  _resistance?: boolean;
  style?: React.CSSProperties;
}

// Custom SwipeableViews component to replace the deprecated library
const MuiSwipeableViews = ({
  index,
  onChangeIndex,
  children,
  _animateHeight: _animateHeightProp = false,
  _resistance: _resistanceProp = true,
  style = {}
}: MuiSwipeableViewsProps) => {
  void _animateHeightProp;
  void _resistanceProp;
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const childCount = React.Children.count(children);
      if (childCount > 0 && index >= 0 && index < childCount) {
        const slideWidth = container.offsetWidth || 0;
        if (slideWidth === 0) return;

        container.scrollTo({
          left: slideWidth * index,
          behavior: 'smooth'
        });
      }
    }
  }, [index, children]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (onChangeIndex && e?.currentTarget) {
      // Use requestAnimationFrame to avoid too many calls during scroll
      requestAnimationFrame(() => {
        const container = e.currentTarget;
        if (!container) return;

        const slideWidth = container.offsetWidth || 0;
        if (slideWidth === 0) return;

        const scrollPosition = container.scrollLeft || 0;
        const newIndex = Math.round(scrollPosition / slideWidth);

        // Only trigger change if the index actually changed and is valid
        if (newIndex !== index && newIndex >= 0 && newIndex < React.Children.count(children)) {
          onChangeIndex(newIndex);
        }
      });
    }
  };

  // Add a touch event handler to detect end of swipe
  const handleTouchEnd = () => {
    if (containerRef.current && onChangeIndex) {
      const container = containerRef.current;
      const slideWidth = container.offsetWidth || 0;
      if (slideWidth === 0) return;

      const scrollPosition = container.scrollLeft || 0;
      const newIndex = Math.round(scrollPosition / slideWidth);

      // Only trigger change if the index actually changed and is valid
      if (newIndex !== index && newIndex >= 0 && newIndex < React.Children.count(children)) {
        onChangeIndex(newIndex);
      }
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        overflow: 'auto',
        scrollSnapType: 'x mandatory',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        ...style
      }}
      onScroll={handleScroll}
      onTouchEnd={handleTouchEnd}
    >
      {React.Children.map(children, (child, _i) => (
        <Box
          sx={{
            flexShrink: 0,
            width: '100%',
            scrollSnapAlign: 'start',
          }}
        >
          {child}
        </Box>
      ))}
    </Box>
  );
};

const StyledTab = styled(Tab)(() => ({
  textTransform: 'none',
  minWidth: '25%',
  marginRight: 'auto',
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"'
  ].join(','),
  '&:hover': {
    color: '#3949ab',
    opacity: 1
  },
  '&:focus': {
    cursor: 'not-allowed'
  }
}));

// Removed unused TabPanelActive
/* const TabPanelActive = styled(Box)(({ theme }) => ({
  padding: `${theme.spacing(1)}px ${theme.spacing(3)}px`,
  backgroundColor: '#d0f6bb'
})); */

const CallInfoCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1]
}));

const StatusLabel = styled(Typography)({
  fontWeight: 500,
  marginBottom: '4px',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  opacity: 0.7
});

const StatusValue = styled(Typography)({
  fontWeight: 600,
  fontSize: '0.95rem',
  marginBottom: '10px',
});

const CallInfoGrid = styled(Grid)(({ theme }) => ({
  marginTop: theme.spacing(1)
}));

// We're using the styled components already defined above

interface DurationState {
  callDuration: number;
  callDurationIntrId: number;
  callDurationActive: boolean;
  ringDuration: number;
  ringDurationIntrId: number;
  ringDurationActive: boolean;
}

const emptyDuration = (): DurationState => ({
  callDuration: 0,
  callDurationIntrId: 0,
  callDurationActive: false,
  ringDuration: 0,
  ringDurationIntrId: 0,
  ringDurationActive: false
});

function SwipeCaruselBlock({
  localStatePhone, activeChannel, setActiveChannel, durations: durationsProp
}: SwipeCaruselBlockProps) {
  const [internalDurations, setInternalDurations] = useState<DurationState[]>(
    [emptyDuration(), emptyDuration(), emptyDuration()]
  );
  const durations = durationsProp ?? internalDurations;
  const { displayCalls } = localStatePhone;
  const ONE_SECOND = 1000;

  useEffect(() => {
    // When the store owns the durations, the block is purely presentational.
    if (durationsProp) return undefined;
    const interval = setInterval(() => {
      // Converting forEach to for...of loop for better performance and to fix lint issues
      for (const [key, displayCall] of displayCalls.entries()) {
        if (displayCall.inCall) {
          if (!displayCall.inAnswer && !internalDurations[key].ringDurationActive) {
            setInternalDurations((oldDurations) => {
              const next = oldDurations.slice();
              next[key] = {
                ...next[key],
                ringDuration: next[key].ringDuration + 1,
              };
              return next;
            });
          } else if (displayCall.inAnswer && !internalDurations[key].callDurationActive) {
            setInternalDurations((oldDurations) => {
              const next = oldDurations.slice();
              next[key] = {
                ...next[key],
                callDuration: next[key].callDuration + 1,
                ringDurationActive: false
              };
              return next;
            });
          }
        } else {
          if (internalDurations[key].callDuration !== 0 || internalDurations[key].ringDuration !== 0) {
            setInternalDurations((oldDurations) => {
              const next = oldDurations.slice();
              next[key] = {
                ...next[key],
                callDuration: 0,
                callDurationActive: false,
                ringDuration: 0,
                ringDurationActive: false
              };
              return next;
            });
          }
        }
      }
    }, ONE_SECOND);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [displayCalls, internalDurations, durationsProp]);

  const handleTabChangeIndex = (index: number) => {
    setActiveChannel(index);
  };
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveChannel(newValue);
  };

  return (
    <div>
      <AppBar position="static" color="default">
        <Tabs
          value={activeChannel}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <StyledTab label={m.channel({ number: 1 })} {...a11yProps(0)} />
          <StyledTab label={m.channel({ number: 2 })} {...a11yProps(1)} />
          <StyledTab label={m.channel({ number: 3 })} {...a11yProps(2)} />
        </Tabs>
      </AppBar>
      <MuiSwipeableViews
        index={activeChannel}
        onChangeIndex={handleTabChangeIndex}
      >
        {displayCalls.map((displayCall, key) => (
          <TabPanel
            key={`${displayCall.id}-TabPanel`}
            className={displayCall.hold ? 'tabPanelHold' : 'tabPanelActive'}
            value={activeChannel}
            index={key}
          >
            {() => {
              if (displayCall.inCall === true) {
                if (displayCall.inAnswer === true) {
                  if (displayCall.hold === true) {
                    return (
                       // Show hold Call info
                      <CallInfoCard elevation={1}>
                        <Chip
                          icon={<PauseCircleIcon size={16} />}
                          label={m.on_hold()}
                          size="small"
                          color="warning"
                          variant="filled"
                          sx={{ mb: 1.5 }}
                        />

                        <CallInfoGrid container spacing={2}>
                          <Grid item xs={6}>
                            <StatusLabel>{m.status()}</StatusLabel>
                            <StatusValue>
                        {translateCallInfo(displayCall.callInfo)}
                      </StatusValue>
                          </Grid>

                          <Grid item xs={6}>
                            <StatusLabel>{m.direction()}</StatusLabel>
                            <StatusValue sx={{ display: 'flex', alignItems: 'center' }}>
                              {displayCall.direction === 'outgoing' ? (
                                <>
                                  <PhoneOutgoingIcon size={16} style={{ marginRight: '4px', color: '#4caf50' }} />
                                  {m.outgoing()}
                                </>
                              ) : (
                                <>
                                  <PhoneIncomingIcon size={16} style={{ marginRight: '4px', color: '#2196f3' }} />
                                  {m.incoming()}
                                </>
                              )}
                            </StatusValue>
                          </Grid>

                          <Grid item xs={6}>
                            <StatusLabel>{m.ring_duration()}</StatusLabel>
                            <StatusValue>{`${Math.floor(durations[key].ringDuration / 60).toString().padStart(2, '0')}:${(durations[key].ringDuration % 60).toString().padStart(2, '0')}`}</StatusValue>
                          </Grid>

                          <Grid item xs={6}>
                            <StatusLabel>{m.call_duration()}</StatusLabel>
                            <StatusValue>{`${Math.floor(durations[key].callDuration / 60).toString().padStart(2, '0')}:${(durations[key].callDuration % 60).toString().padStart(2, '0')}`}</StatusValue>
                          </Grid>

                          <Grid item xs={12}>
                            <StatusLabel>{m.number()}</StatusLabel>
                            <StatusValue sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon size={16} style={{ marginRight: '8px' }} />
                              {displayCall.callNumber}
                            </StatusValue>
                          </Grid>
                        </CallInfoGrid>
                      </CallInfoCard>
                    );
                  }
                  if (displayCall.inTransfer === true) {
                    return (
                       // Show In Transfer info
                      <CallInfoCard elevation={1}>
                        <Chip
                          icon={<ArrowsClockwiseIcon size={16} />}
                          label={m.in_transfer()}
                          size="small"
                          color="info"
                          variant="filled"
                          sx={{ mb: 1.5 }}
                        />

                        <CallInfoGrid container spacing={2}>
                          <Grid item xs={6}>
                            <StatusLabel>{m.status()}</StatusLabel>
                            <StatusValue>
                        {translateCallInfo(displayCall.callInfo)}
                      </StatusValue>
                          </Grid>

                          <Grid item xs={6}>
                            <StatusLabel>{m.direction()}</StatusLabel>
                            <StatusValue sx={{ display: 'flex', alignItems: 'center' }}>
                              {displayCall.direction === 'outgoing' ? (
                                <>
                                  <PhoneOutgoingIcon size={16} style={{ marginRight: '4px', color: '#4caf50' }} />
                                  {m.outgoing()}
                                </>
                              ) : (
                                <>
                                  <PhoneIncomingIcon size={16} style={{ marginRight: '4px', color: '#2196f3' }} />
                                  {m.incoming()}
                                </>
                              )}
                            </StatusValue>
                          </Grid>

                          <Grid item xs={6}>
                            <StatusLabel>{m.ring_duration()}</StatusLabel>
                            <StatusValue>{`${Math.floor(durations[key].ringDuration / 60).toString().padStart(2, '0')}:${(durations[key].ringDuration % 60).toString().padStart(2, '0')}`}</StatusValue>
                          </Grid>

                          <Grid item xs={6}>
                            <StatusLabel>{m.call_duration()}</StatusLabel>
                            <StatusValue>{`${Math.floor(durations[key].callDuration / 60).toString().padStart(2, '0')}:${(durations[key].callDuration % 60).toString().padStart(2, '0')}`}</StatusValue>
                          </Grid>

                          <Grid item xs={6}>
                            <StatusLabel>{m.number()}</StatusLabel>
                            <StatusValue sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon size={16} style={{ marginRight: '4px' }} />
                              {displayCall.callNumber}
                            </StatusValue>
                          </Grid>

                          <Grid item xs={6}>
                              <StatusLabel>{m.transfer_to()}</StatusLabel>
                            <StatusValue sx={{ color: 'primary.main' }}>
                              {displayCall.transferNumber}
                            </StatusValue>
                          </Grid>

                          {displayCall.attendedTransferOnline.length > 1 && !displayCall.inConference && (
                            <Grid item xs={12}>
                              <StatusLabel>{m.talking_with()}</StatusLabel>
                              <StatusValue sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                {displayCall.attendedTransferOnline}
                              </StatusValue>
                            </Grid>
                          )}
                        </CallInfoGrid>
                      </CallInfoCard>
                    );
                  }

                  return (
                    // Show In Call info
                    <CallInfoCard elevation={1}>
                      <Chip
                        icon={<PhoneIcon size={16} />}
                        label={m.active_call()}
                        size="small"
                        color="success"
                        variant="filled"
                        sx={{ mb: 1.5 }}
                      />

                      <CallInfoGrid container spacing={2}>
                        <Grid item xs={6}>
                          <StatusLabel>{m.status()}</StatusLabel>
                          <StatusValue>
                            {translateCallInfo(displayCall.callInfo)}
                          </StatusValue>
                        </Grid>

                        <Grid item xs={6}>
                          <StatusLabel>{m.direction()}</StatusLabel>
                          <StatusValue sx={{ display: 'flex', alignItems: 'center' }}>
                            {displayCall.direction === 'outgoing' ? (
                              <>
                                <PhoneOutgoingIcon size={16} style={{ marginRight: '4px', color: '#4caf50' }} />
                                Outgoing
                              </>
                            ) : (
                              <>
                                <PhoneIncomingIcon size={16} style={{ marginRight: '4px', color: '#2196f3' }} />
                                Incoming
                              </>
                            )}
                          </StatusValue>
                        </Grid>

                        <Grid item xs={6}>
                          <StatusLabel>{m.ring_duration()}</StatusLabel>
                          <StatusValue>{`${Math.floor(durations[key].ringDuration / 60).toString().padStart(2, '0')}:${(durations[key].ringDuration % 60).toString().padStart(2, '0')}`}</StatusValue>
                        </Grid>

                        <Grid item xs={6}>
                          <StatusLabel>{m.call_duration()}</StatusLabel>
                          <StatusValue sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {`${Math.floor(durations[key].callDuration / 60).toString().padStart(2, '0')}:${(durations[key].callDuration % 60).toString().padStart(2, '0')}`}
                          </StatusValue>
                        </Grid>

                        <Grid item xs={12}>
                          <StatusLabel>{m.number()}</StatusLabel>
                          <StatusValue sx={{ display: 'flex', alignItems: 'center' }}>
                            <PhoneIcon size={16} style={{ marginRight: '8px' }} />
                            {displayCall.callNumber}
                          </StatusValue>
                        </Grid>
                      </CallInfoGrid>
                    </CallInfoCard>
                  );
                }

                return (
                  // Show Calling/Ringing info
                  <CallInfoCard elevation={1}>
                    <Chip
                      icon={<PhoneXIcon size={16} />}
                      label={m.ringing()}
                      size="small"
                      color="warning"
                      variant="filled"
                      sx={{ mb: 1.5 }}
                    />

                    <CallInfoGrid container spacing={2}>
                      <Grid item xs={6}>
                        <StatusLabel>{m.status()}</StatusLabel>
                        <StatusValue>
                          {translateCallInfo(displayCall.callInfo)}
                        </StatusValue>
                      </Grid>

                      <Grid item xs={6}>
                        <StatusLabel>{m.direction()}</StatusLabel>
                        <StatusValue sx={{ display: 'flex', alignItems: 'center' }}>
                          {displayCall.direction === 'outgoing' ? (
                            <>
                              <PhoneOutgoingIcon size={16} style={{ marginRight: '4px', color: '#4caf50' }} />
                              Outgoing
                            </>
                          ) : (
                            <>
                              <PhoneIncomingIcon size={16} style={{ marginRight: '4px', color: '#2196f3' }} />
                              Incoming
                            </>
                          )}
                        </StatusValue>
                      </Grid>

                      <Grid item xs={6}>
                        <StatusLabel>{m.ring_duration()}</StatusLabel>
                        <StatusValue sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                          {`${Math.floor(durations[key].ringDuration / 60).toString().padStart(2, '0')}:${(durations[key].ringDuration % 60).toString().padStart(2, '0')}`}
                        </StatusValue>
                      </Grid>

                      <Grid item xs={12}>
                        <StatusLabel>{m.number()}</StatusLabel>
                        <StatusValue sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon size={16} style={{ marginRight: '8px' }} />
                          {displayCall.callNumber}
                        </StatusValue>
                      </Grid>
                    </CallInfoGrid>
                  </CallInfoCard>
                );
              }

              return (
                // Show Ready info
                <CallInfoCard >
                  <Chip
                    icon={<DeviceMobileIcon size={16} />}
                    label={m.ready()}
                    size="small"
                    color="primary"
                    variant="filled"
                    sx={{ mb: 1.5 }}
                  />

                  <CallInfoGrid container spacing={2}>
                    <Grid item xs={12}>
                      <StatusLabel>{m.status()}</StatusLabel>
                      <StatusValue color="primary"                      >
                        {translateCallInfo(displayCall.callInfo)} {m.channel({ number: displayCall.id + 1 })}
                      </StatusValue>
                    </Grid>
                  </CallInfoGrid>
                </CallInfoCard>
              );
            }}

          </TabPanel>
        ))}

      </MuiSwipeableViews>
    </div>
  );
}

export default SwipeCaruselBlock;
