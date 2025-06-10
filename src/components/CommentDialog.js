import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Alert,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  ListItemAvatar
} from '@mui/material';

const CommentDialog = ({ 
  open, 
  onClose, 
  workId,
  onSubmit,
  comments = []
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showLowRatingWarning, setShowLowRatingWarning] = useState(false);

  const handleSubmit = () => {
    if (rating <= 2 && !showLowRatingWarning) {
      setShowLowRatingWarning(true);
      return;
    }

    onSubmit({
      workId,
      rating,
      comment,
      timestamp: new Date().toISOString()
    });
    onClose();
    setRating(0);
    setComment('');
    setShowLowRatingWarning(false);
  };

  const handleClose = () => {
    onClose();
    setRating(0);
    setComment('');
    setShowLowRatingWarning(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>发表评论</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography component="legend" gutterBottom>
            评分
          </Typography>
          <Rating
            value={rating}
            onChange={(event, newValue) => {
              setRating(newValue);
              setShowLowRatingWarning(false);
            }}
            max={5}
            size="large"
          />
        </Box>

        {showLowRatingWarning && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            确定要这么评价么，多多鼓励才能有好作品
          </Alert>
        )}

        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="评论内容"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="写下你的评论..."
        />

        {comments.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              已有评论
            </Typography>
            <List>
              {comments.map((item) => (
                <ListItem key={item.id} alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>{item.author.charAt(0).toUpperCase()}</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography component="span" variant="subtitle1" sx={{ mr: 1 }}>
                          {item.author}
                        </Typography>
                        <Rating value={item.rating} size="small" readOnly />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                        >
                          {item.comment}
                        </Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {new Date(item.timestamp).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>取消</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!rating}
        >
          提交
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommentDialog;
